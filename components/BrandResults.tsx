import type { ScanResult, Brand } from '@/lib/types'
import Image from 'next/image'

const confidenceColor = {
  high: 'bg-green-500/20 text-green-300 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  low: 'bg-white/10 text-white/50 border-white/20',
}

function BrandCard({ brand }: { brand: Brand }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-white">{brand.name}</span>
        <div className="flex items-center gap-2">
          {brand.category && (
            <span className="text-xs text-white/40 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
              {brand.category}
            </span>
          )}
          <span
            className={`text-xs border rounded-full px-2 py-0.5 capitalize ${confidenceColor[brand.confidence]}`}
          >
            {brand.confidence}
          </span>
        </div>
      </div>
      {brand.mentions.length > 0 && (
        <ul className="space-y-1">
          {brand.mentions.map((m, i) => (
            <li key={i} className="text-sm text-white/50 italic before:content-['"'] after:content-['"']">
              {m}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function BrandResults({ result }: { result: ScanResult }) {
  return (
    <div className="space-y-4">
      {/* Video info */}
      <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
        {result.video_thumbnail && (
          <Image
            src={result.video_thumbnail}
            alt="thumbnail"
            width={72}
            height={72}
            className="rounded-lg object-cover shrink-0"
            unoptimized
          />
        )}
        <div className="min-w-0">
          <p className="font-medium text-white truncate">{result.video_title || 'TikTok Video'}</p>
          {result.video_author && (
            <p className="text-sm text-white/50">@{result.video_author}</p>
          )}
          <p className="text-xs text-white/30 mt-1 truncate">{result.tiktok_url}</p>
        </div>
      </div>

      {/* Brand count summary */}
      <div className="flex items-center gap-2 text-sm text-white/60">
        <span className="text-brand-400 font-semibold text-lg">{result.brands.length}</span>
        {result.brands.length === 1 ? 'brand detected' : 'brands detected'}
        {result.id && (
          <span className="ml-auto text-white/30 text-xs">Saved to history</span>
        )}
      </div>

      {result.brands.length > 0 ? (
        <div className="space-y-3">
          {result.brands.map((b, i) => (
            <BrandCard key={i} brand={b} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-white/40 text-sm">
          No brand mentions detected in this video.
        </div>
      )}

      {/* Transcript collapsible */}
      {result.transcript && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-white/40 hover:text-white/60 transition-colors list-none flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            View transcript
          </summary>
          <div className="mt-2 text-sm text-white/40 bg-white/5 rounded-xl p-4 leading-relaxed max-h-48 overflow-y-auto">
            {result.transcript}
          </div>
        </details>
      )}
    </div>
  )
}
