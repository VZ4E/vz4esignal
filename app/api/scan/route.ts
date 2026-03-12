import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Brand, ScanResult } from '@/lib/types'

// ── 1. Fetch TikTok video info via RapidAPI ──────────────────────────────────
async function fetchTikTokData(url: string): Promise<{
  playUrl: string
  title: string
  author: string
  thumbnail: string
}> {
  const res = await fetch(
    `https://${process.env.RAPIDAPI_TIKTOK_HOST}/api/video/info?url=${encodeURIComponent(url)}`,
    {
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
        'X-RapidAPI-Host': process.env.RAPIDAPI_TIKTOK_HOST!,
      },
      cache: 'no-store',
    }
  )

  if (!res.ok) {
    throw new Error(`RapidAPI TikTok error: ${res.status} ${res.statusText}`)
  }

  const json = await res.json()

  // Normalise across common RapidAPI TikTok response shapes
  const video = json?.data?.video ?? json?.itemInfo?.itemStruct?.video ?? json?.video ?? {}
  const author =
    json?.data?.author?.nickname ??
    json?.itemInfo?.itemStruct?.author?.nickname ??
    json?.author?.nickname ??
    'Unknown'
  const title =
    json?.data?.title ??
    json?.itemInfo?.itemStruct?.desc ??
    json?.desc ??
    ''
  const thumbnail =
    video?.cover ??
    video?.dynamicCover ??
    json?.data?.cover ??
    ''
  const playUrl =
    video?.playAddr ??
    video?.downloadAddr ??
    json?.data?.play ??
    ''

  if (!playUrl) throw new Error('Could not extract video/audio URL from TikTok response')

  return { playUrl, title, author, thumbnail }
}

// ── 2. Transcribe audio via Transcript24 ─────────────────────────────────────
async function transcribeAudio(audioUrl: string): Promise<string> {
  const res = await fetch('https://transcript24.p.rapidapi.com/transcript', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
      'X-RapidAPI-Host': 'transcript24.p.rapidapi.com',
    },
    body: JSON.stringify({ url: audioUrl }),
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Transcript24 error: ${res.status} ${res.statusText}`)
  }

  const json = await res.json()

  // Handle both synchronous (transcript in response) and async (job polling) shapes
  if (json?.transcript) return json.transcript as string
  if (json?.text) return json.text as string

  // Async job: poll until done (max 60 s)
  const jobId = json?.job_id ?? json?.id
  if (!jobId) throw new Error('Transcript24: no transcript or job_id in response')

  for (let i = 0; i < 12; i++) {
    await new Promise((r) => setTimeout(r, 5000))
    const poll = await fetch(`https://transcript24.p.rapidapi.com/transcript/${jobId}`, {
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
        'X-RapidAPI-Host': 'transcript24.p.rapidapi.com',
      },
      cache: 'no-store',
    })
    const pollJson = await poll.json()
    if (pollJson?.status === 'completed' || pollJson?.transcript) {
      return (pollJson.transcript ?? pollJson.text) as string
    }
  }

  throw new Error('Transcript24: transcription timed out')
}

// ── 3. Detect brands via Perplexity AI ───────────────────────────────────────
async function detectBrands(transcript: string): Promise<{ brands: Brand[]; raw: string }> {
  const prompt = `You are a brand sponsorship detector for TikTok videos.

Given the transcript below, identify every brand name, product, company, or sponsored mention.
Return ONLY valid JSON — an object with two keys:
  "brands": array of objects each with:
    - "name": string (brand or product name)
    - "confidence": "high" | "medium" | "low"
    - "category": string (e.g. "Fashion", "Tech", "Food & Beverage", "Beauty", etc.)
    - "mentions": string[] (exact quoted phrases from the transcript)
  "summary": string (1–2 sentence summary of brand presence)

If no brands are found return { "brands": [], "summary": "No brand mentions detected." }

Transcript:
"""
${transcript}
"""`

  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    }),
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Perplexity error: ${res.status} ${res.statusText}`)
  }

  const json = await res.json()
  const raw: string = json?.choices?.[0]?.message?.content ?? ''

  // Extract JSON block from the response (model may wrap it in markdown)
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return { brands: [], raw }

  try {
    const parsed = JSON.parse(jsonMatch[0])
    return { brands: parsed.brands ?? [], raw }
  } catch {
    return { brands: [], raw }
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'TikTok URL is required' }, { status: 400 })
    }

    if (!url.includes('tiktok.com')) {
      return NextResponse.json({ success: false, error: 'Please provide a valid TikTok URL' }, { status: 400 })
    }

    // Step 1 – video info
    const { playUrl, title, author, thumbnail } = await fetchTikTokData(url)

    // Step 2 – transcription
    const transcript = await transcribeAudio(playUrl)

    // Step 3 – brand detection
    const { brands, raw: rawAnalysis } = await detectBrands(transcript)

    const result: ScanResult = {
      tiktok_url: url,
      video_title: title,
      video_author: author,
      video_thumbnail: thumbnail,
      transcript,
      brands,
      raw_analysis: rawAnalysis,
    }

    // Persist to Supabase if the user is authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: inserted } = await supabase
        .from('scans')
        .insert({
          user_id: user.id,
          tiktok_url: url,
          video_title: title,
          video_author: author,
          video_thumbnail: thumbnail,
          transcript,
          brands,
          raw_analysis: rawAnalysis,
        })
        .select('id, created_at')
        .single()

      if (inserted) {
        result.id = inserted.id
        result.created_at = inserted.created_at
      }
    }

    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    console.error('[scan]', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
