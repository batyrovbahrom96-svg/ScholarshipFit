'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Play, ShieldCheck, Sparkles, ArrowRight, Mail } from 'lucide-react'

// Welcome video from the founder — uploaded 2026-07-10.
const FOUNDER_VIDEO_URL   = 'https://customer-assets.emergentagent.com/job_stellar-fit/artifacts/owab1k68_2026-07-10%2022.50.13.mp4'
const FOUNDER_POSTER_URL  = ''
const FOUNDER_EMAIL       = 'batyrov.bakhrom@inbox.ru'
const FOUNDER_NAME        = 'Bakhrom Batyrov'
const FOUNDER_ROLE        = 'Founder · ScholarshipFit.com'
const FOUNDER_QUOTE       = 'Built for the students I wish I had this for.'

function VideoSlot() {
  const [primed, setPrimed] = useState(false)
  const videoRef = useRef(null)

  const play = () => {
    setPrimed(true)
    requestAnimationFrame(async () => {
      try { await videoRef.current?.play() } catch { /* browser may block */ }
    })
  }

  const hasVideo = !!FOUNDER_VIDEO_URL

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[#D4AF37]/25 bg-black">
      {!primed ? (
        <button
          onClick={hasVideo ? play : undefined}
          className={`absolute inset-0 flex flex-col items-center justify-center gap-4 focus:outline-none ${hasVideo ? 'cursor-pointer group' : 'cursor-default'}`}
          aria-label="Play founder welcome message"
        >
          {FOUNDER_POSTER_URL ? (
            <img src={FOUNDER_POSTER_URL} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70"/>
          ) : (
            <>
              <div className="absolute inset-0 opacity-50 bg-[radial-gradient(closest-side,rgba(212,175,55,0.32),transparent_70%)]"/>
              <div className="absolute inset-0 opacity-70 bg-[radial-gradient(1px_1px_at_20%_30%,rgba(255,255,255,0.35),transparent_60%),radial-gradient(1px_1px_at_80%_70%,rgba(212,175,55,0.35),transparent_60%),radial-gradient(1px_1px_at_50%_50%,rgba(255,255,255,0.25),transparent_60%)] [background-size:200px_200px]"/>
            </>
          )}

          {hasVideo ? (
            <>
              <div className="relative z-10 h-20 w-20 rounded-full bg-[#D4AF37]/95 text-black flex items-center justify-center shadow-[0_10px_50px_-10px_rgba(212,175,55,0.7)] group-hover:scale-110 transition">
                <Play className="h-8 w-8 ml-1" fill="currentColor"/>
              </div>
              <div className="relative z-10 text-center px-4">
                <div className="text-sm md:text-base font-semibold text-white">{FOUNDER_NAME}</div>
                <div className="text-[11px] uppercase tracking-widest text-[#D4AF37] mt-1">{FOUNDER_ROLE}</div>
              </div>
            </>
          ) : (
            <div className="relative z-10 text-center px-6 max-w-md">
              <div className="mx-auto mb-4 h-14 w-14 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-[#D4AF37]"/>
              </div>
              <div className="text-lg md:text-xl font-semibold text-white">A welcome message is on the way</div>
            </div>
          )}
        </button>
      ) : (
        <video
          ref={videoRef}
          src={FOUNDER_VIDEO_URL}
          poster={FOUNDER_POSTER_URL || undefined}
          className="absolute inset-0 h-full w-full object-cover"
          preload="metadata"
          playsInline
          controls
        />
      )}

      <div className="absolute top-3 right-3 z-20 inline-flex items-center gap-1 rounded-full border border-[#D4AF37]/40 bg-black/70 px-2 py-0.5 text-[10px] font-medium text-[#F5D67B] backdrop-blur">
        <ShieldCheck className="h-3 w-3"/> Founder note
      </div>
    </div>
  )
}

export default function FounderVideo() {
  const firstName = FOUNDER_NAME.split(' ')[0]
  return (
    <section className="relative border-t border-white/5">
      <div className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="grid gap-10 md:grid-cols-12 items-center">
          <div className="md:col-span-5" data-reveal>
            <div className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">A note from the founder</div>
            <h2 className="mt-3 text-3xl md:text-5xl font-semibold tracking-[-0.03em] leading-[1.05] text-white">
              Why we built <span className="text-gold-hi">ScholarshipFit.</span>
            </h2>
            <blockquote className="mt-6 text-lg md:text-xl text-white/80 leading-relaxed border-l-2 border-[#D4AF37]/50 pl-4 italic">
              &ldquo;{FOUNDER_QUOTE}&rdquo;
            </blockquote>
            <p className="mt-4 text-white/60 leading-relaxed">
              I&apos;m {firstName} — I built ScholarshipFit after wasting too many hours applying to programs that were never going to say yes.
              This platform is what I wish existed when I was an international student researching scholarships.
              Watch the video for the full story — or hit the quiz and see what we mean.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/quiz">
                <Button size="lg" className="btn-gold btn-pill h-12 px-8 font-semibold">
                  Take the 8-step quiz <ArrowRight className="ml-2 h-4 w-4"/>
                </Button>
              </Link>
              <a href={`mailto:${FOUNDER_EMAIL}`}>
                <Button size="lg" variant="outline" className="border-white/20 text-white/80 hover:bg-white/5 h-12 px-6">
                  <Mail className="mr-2 h-4 w-4"/>Email the founder
                </Button>
              </a>
            </div>
          </div>
          <div className="md:col-span-7" data-reveal data-reveal-delay="200">
            <VideoSlot />
            <p className="mt-3 text-xs text-white/40 text-center">
              Personal welcome message from {FOUNDER_NAME}, founder of ScholarshipFit.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
