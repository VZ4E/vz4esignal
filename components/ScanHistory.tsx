'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { ScanResult } from '@/lib/types'
import BrandResults from './BrandResults'

export default function ScanHistory({ scans }: { scans: ScanResult[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (scans.length === 0) {
    return (
      <div className="text-center py-16 text-white/40">
        <p className="text-4xl mb-3">📭</p>
        <p>No scans yet. Paste a TikTok URL on the home page to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {scans.map((scan) => (
        <div key={scan.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === scan.id ? null : scan.id!)}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors"
          >
            {scan.video_thumbnail && (
              <Image
                src={scan.video_thumbnail}
                alt=""
                width={48}
                height={48}
                className="rounded-lg object-cover shrink-0"
                unoptimized
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white text-sm truncate">
                {scan.video_title || scan.tiktok_url}
              </p>
              <p className="text-xs text-white/40 mt-0.5">
                {scan.brands.length} brand{scan.brands.length !== 1 ? 's' : ''} •{' '}
                {scan.created_at
                  ? new Date(scan.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : ''}
              </p>
            </div>
            <span className="text-white/30 text-xs shrink-0">
              {expanded === scan.id ? '▲' : '▼'}
            </span>
          </button>

          {expanded === scan.id && (
            <div className="px-4 pb-4 border-t border-white/10 pt-4">
              <BrandResults result={scan} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
