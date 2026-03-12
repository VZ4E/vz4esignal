export interface Brand {
  name: string
  confidence: 'high' | 'medium' | 'low'
  mentions: string[]
  category?: string
}

export interface ScanResult {
  id?: string
  tiktok_url: string
  video_title?: string
  video_author?: string
  video_thumbnail?: string
  transcript?: string
  brands: Brand[]
  raw_analysis?: string
  created_at?: string
}

export interface ScanResponse {
  success: boolean
  data?: ScanResult
  error?: string
}
