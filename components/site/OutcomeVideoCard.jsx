'use client'
import { useState, useRef } from 'react'
import { Play, Pause, GraduationCap, MapPin, Award, ShieldCheck, Linkedin } from 'lucide-react'

// -----------------------------------------------------------------------------
// OutcomeVideoCard — reusable video-testimonial card.
// - preload="none" so the ~20MB mov files DON'T auto-download on page load.
// - The full <video> element only renders once the user clicks Play — before
//   that, we show a lightweight "poster" (gradient placeholder + name).
// - Once the user has clicked once, controls become native.
// -----------------------------------------------------------------------------
export default function OutcomeVideoCard({ o, compact = false }) {
  const [primed, setPrimed] = useState(false)
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef(null)

  const play = async () => {
    setPrimed(true)
    // Wait a tick for React to mount the <video>, then attempt playback.
    requestAnimationFrame(async () => {
      try {
        await videoRef.current?.play()
        setPlaying(true)
      } catch (e) {
        // Autoplay blocked — the user can still hit the native play button.
      }
    })
  }

  const togglePlay = async () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { try { await v.play(); setPlaying(true) } catch { /* browser may block play() */ } }
    else { v.pause(); setPlaying(false) }
  }

  return (
    <div className="group relative rounded-2xl border border-white/10 bg-white/[0.03] hover:border-white/25 transition overflow-hidden flex flex-col">
      {/* Video area — 9:16 portrait aspect for these mobile-recorded testimonials */}
      <div className="relative aspect-[9/16] w-full bg-gradient-to-br from-[#1a1512] via-[#0a0a0a] to-[#080807] overflow-hidden">
        {!primed ? (
          // ------- Poster / thumbnail state (no video loaded yet) -------
          <button
            onClick={play}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 focus:outline-none"
            aria-label={`Play ${o.name}'s testimonial`}
          >
            {/* Ambient gradient dots for cinematic feel */}
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(closest-side,rgba(212,175,55,0.25),transparent_70%)]"/>
            <div className="absolute inset-0 opacity-60 bg-[radial-gradient(1px_1px_at_20%_30%,rgba(255,255,255,0.35),transparent_60%),radial-gradient(1px_1px_at_80%_70%,rgba(212,175,55,0.35),transparent_60%),radial-gradient(1px_1px_at_50%_50%,rgba(255,255,255,0.25),transparent_60%)] [background-size:200px_200px]"/>

            {/* Play button */}
            <div className="relative z-10 h-16 w-16 rounded-full bg-[#D4AF37]/95 text-black flex items-center justify-center shadow-[0_10px_40px_-10px_rgba(212,175,55,0.7)] group-hover:scale-110 transition">
              <Play className="h-7 w-7 ml-0.5" fill="currentColor"/>
            </div>
            <div className="relative z-10 text-center px-4">
              <div className="text-sm md:text-base font-semibold text-white">{o.name}</div>
              <div className="text-[11px] uppercase tracking-widest text-[#D4AF37] mt-1 inline-flex items-center gap-2">
                {o.university_short}
                {o.linkedin_url && (
                  <a
                    href={o.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 rounded-full border border-[#0A66C2]/40 bg-[#0A66C2]/10 px-1.5 py-0.5 text-[9px] text-[#0A66C2] hover:bg-[#0A66C2]/20"
                    aria-label={`Verify ${o.name} on LinkedIn`}
                  >
                    <Linkedin className="h-2.5 w-2.5"/> Verify
                  </a>
                )}
              </div>
              <div className="text-[10px] text-white/45 mt-1">{o.duration_hint}</div>
            </div>
          </button>
        ) : (
          // ------- Primed video element -------
          <>
            <video
              ref={videoRef}
              src={o.video_url}
              className="absolute inset-0 h-full w-full object-cover bg-black"
              preload="metadata"
              playsInline
              controls
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
            {/* Manual pause overlay (hidden while playing) */}
            {!playing && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none"
                aria-label="Play"
              />
            )}
          </>
        )}

        {/* Consent badge */}
        <div className="absolute top-3 right-3 z-20 inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-200 backdrop-blur">
          <ShieldCheck className="h-3 w-3"/> Verified
        </div>
      </div>

      {/* Details */}
      <div className={`p-4 ${compact ? 'md:p-4' : 'md:p-5'} flex-1 flex flex-col`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-sm md:text-base font-semibold text-white truncate">{o.name}</div>
            <div className="mt-0.5 text-[11px] text-white/50 flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 shrink-0"/>{o.nationality} → {o.country}
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-1.5 text-xs">
          <div className="flex items-start gap-1.5 text-white/80">
            <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D4AF37]"/>
            <span className="truncate">{o.university}</span>
          </div>
          <div className="flex items-start gap-1.5 text-white/80">
            <Award className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D4AF37]"/>
            <span className="truncate">{o.scholarship}</span>
          </div>
        </div>

        {!compact && (
          <blockquote className="mt-4 text-sm text-white/75 leading-relaxed border-l-2 border-[#D4AF37]/40 pl-3">
            &ldquo;{o.quote}&rdquo;
          </blockquote>
        )}
      </div>
    </div>
  )
}
