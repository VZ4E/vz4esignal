import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import ScanHistory from '@/components/ScanHistory'
import type { ScanResult } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: scans } = await supabase
    .from('scans')
    .select('id, tiktok_url, video_title, video_author, video_thumbnail, brands, transcript, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Scan History</h1>
            <p className="text-white/40 text-sm mt-0.5">{user.email}</p>
          </div>
          <Link
            href="/"
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + New scan
          </Link>
        </div>

        <ScanHistory scans={(scans ?? []) as ScanResult[]} />
      </main>
    </>
  )
}
