import Header from '@/components/Header'
import ScanForm from '@/components/ScanForm'

export default function Home() {
  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-16 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 text-brand-400 text-sm font-medium">
            <span>⚡</span> Powered by AI
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-balance">
            Detect brand signals
            <br />
            <span className="text-brand-400">in any TikTok video</span>
          </h1>
          <p className="text-white/50 text-lg max-w-lg mx-auto text-balance">
            Paste a TikTok URL. We transcribe the audio and use AI to identify every brand
            mention, sponsorship, and product placement — in seconds.
          </p>
        </div>

        {/* Scan form */}
        <ScanForm />

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 text-sm text-white/40">
          {[
            '🎵 Audio transcription',
            '🤖 AI brand detection',
            '📊 Confidence scoring',
            '🔒 Scan history saved',
          ].map((f) => (
            <span key={f} className="bg-white/5 border border-white/10 rounded-full px-3 py-1">
              {f}
            </span>
          ))}
        </div>
      </main>
    </>
  )
}
