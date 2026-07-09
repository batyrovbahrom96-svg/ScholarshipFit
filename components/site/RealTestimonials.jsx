'use client'
import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Play, ShieldCheck, X, GraduationCap, MapPin, Volume2 } from 'lucide-react'

/* ================================================================
   RealTestimonials — video-first testimonial section
   ----------------------------------------------------------------
   These are REAL scholarship winners who agreed to appear on camera.
   Videos are hosted on the Emergent asset CDN (no extra storage cost).
   Poster frames are extracted at build time into /public/testimonials/posters/.
   ================================================================ */

const TESTIMONIALS = [
  {
    id: 'jurabek',
    name: 'Jurabek Maxmudov',
    origin: 'Uzbekistan',
    scholarship: 'Qatar University Scholarship',
    school: 'Qatar University',
    destination: 'Doha, Qatar',
    poster: '/testimonials/posters/jurabek.jpg',
    videoUrl:
      'https://customer-assets.emergentagent.com/job_stellar-fit/artifacts/p6u66bir_jurabek-maxmudov-qatar-university-scholarship.mov',
    videoType: 'video/mp4', // MOV with H.264 is universally supported as video/mp4
    hook: 'Won a full scholarship to Qatar University',
  },
  {
    id: 'shohrux',
    name: 'Shohrux Ziyodullayev',
    origin: 'Uzbekistan',
    scholarship: 'University of Calgary Scholarship',
    school: 'University of Calgary',
    destination: 'Calgary, Canada',
    poster: '/testimonials/posters/shohrux.jpg',
    videoUrl:
      'https://customer-assets.emergentagent.com/job_stellar-fit/artifacts/s3lgmfm5_shohrux-ziyodullayev-university-of-calgary-scholarship.mov',
    videoType: 'video/mp4',
    hook: 'Earned a scholarship at the University of Calgary',
  },
  {
    id: 'arina',
    name: 'Arina Pak',
    origin: 'Uzbekistan',
    scholarship: 'Université de Bordeaux Stipend',
    school: 'Université de Bordeaux',
    destination: 'Bordeaux, France',
    poster: '/testimonials/posters/arina.jpg',
    videoUrl:
      'https://customer-assets.emergentagent.com/job_stellar-fit/artifacts/z4zfmtj9_arina-pak-universite-de-bordeaux-stipend.mp4',
    videoType: 'video/mp4',
    hook: 'Secured a stipend at Université de Bordeaux',
  },
  {
    id: 'jasur',
    name: 'Jasur Yaxshilikov',
    origin: 'Uzbekistan',
    scholarship: 'University of Wisconsin-Madison Scholarship',
    school: 'University of Wisconsin-Madison',
    destination: 'Madison, USA',
    poster: '/testimonials/posters/jasur.jpg',
    videoUrl:
      'https://customer-assets.emergentagent.com/job_stellar-fit/artifacts/lnfwf9u4_jasur-yaxshilikov-university-of-wisconsin-madison-scholarship.mov',
    videoType: 'video/mp4',
    hook: 'Awarded a scholarship at UW-Madison',
  },
]

/* ---------- inline video card with play overlay ---------- */
function VideoCard({ t, featured = false, onOpen }) {
  return (
    <Card
      className={`group relative overflow-hidden border-white/10 bg-black hover:border-[#D4AF37]/40 transition
        ${featured ? 'md:col-span-2 md:row-span-2' : ''}`}
    >
      <CardContent className="relative p-0">
        {/* Poster + play overlay */}
        <button
          type="button"
          onClick={() => onOpen(t)}
          className="relative block w-full text-left"
          aria-label={`Watch ${t.name}'s testimonial`}
        >
          <div className={`relative w-full ${featured ? 'aspect-[16/10]' : 'aspect-video'} overflow-hidden bg-neutral-900`}>
            {/* Poster image — using native img for external CDN posters */}
            <img
              src={t.poster}
              alt={`${t.name} — ${t.school}`}
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
            {/* Dark gradient overlay for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10"/>
            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`flex items-center justify-center rounded-full bg-[#D4AF37] shadow-[0_0_60px_-10px_rgba(212,175,55,0.6)] transition group-hover:scale-110
                ${featured ? 'h-20 w-20' : 'h-14 w-14'}`}>
                <Play className={`text-black fill-black ${featured ? 'h-8 w-8' : 'h-5 w-5'} ml-1`}/>
              </div>
            </div>
            {/* Verified badge */}
            <div className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full border border-[#D4AF37]/40 bg-black/60 backdrop-blur px-2.5 py-1 text-[10px] uppercase tracking-wider text-[#D4AF37] font-semibold">
              <ShieldCheck className="h-3 w-3"/>Verified winner
            </div>
            {/* Bottom label */}
            <div className={`absolute inset-x-0 bottom-0 p-4 ${featured ? 'md:p-6' : ''}`}>
              <p className={`text-white font-semibold ${featured ? 'text-2xl md:text-3xl' : 'text-lg'}`}>{t.name}</p>
              <div className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-white/85 ${featured ? 'text-sm md:text-base' : 'text-xs'}`}>
                <span className="inline-flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5 text-[#D4AF37]"/>{t.school}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-[#D4AF37]"/>{t.destination}</span>
              </div>
              <p className={`mt-2 text-[#D4AF37] font-medium ${featured ? 'text-sm md:text-base' : 'text-xs'}`}>
                {t.hook}
              </p>
            </div>
          </div>
        </button>
      </CardContent>
    </Card>
  )
}

/* ---------- video lightbox ---------- */
function VideoLightbox({ testimonial, onClose }) {
  const videoRef = useRef(null)
  const open = !!testimonial

  useEffect(() => {
    if (open && videoRef.current) {
      const v = videoRef.current
      v.currentTime = 0
      v.play().catch(() => { /* autoplay may be blocked; user can press play */ })
    }
  }, [open, testimonial?.id])

  if (!testimonial) return null

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl border-[#D4AF37]/25 bg-black/95 p-0 overflow-hidden">
        <DialogTitle className="sr-only">{testimonial.name} — {testimonial.school}</DialogTitle>
        <div className="relative aspect-video w-full bg-black">
          <video
            ref={videoRef}
            key={testimonial.id}
            className="h-full w-full object-contain"
            controls
            playsInline
            preload="auto"
            poster={testimonial.poster}
          >
            <source src={testimonial.videoUrl} type={testimonial.videoType}/>
            Your browser doesn&rsquo;t support HTML5 video.
          </video>
        </div>
        <div className="border-t border-white/10 bg-black p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-lg md:text-xl font-semibold text-white">{testimonial.name}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/70">
                <span className="inline-flex items-center gap-1"><GraduationCap className="h-4 w-4 text-[#D4AF37]"/>{testimonial.school}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4 text-[#D4AF37]"/>{testimonial.destination}</span>
              </div>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-xs text-[#D4AF37] font-medium">
                <ShieldCheck className="h-3 w-3"/>Verified scholarship winner
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close video"
              className="shrink-0 rounded-full border border-white/15 bg-transparent p-2 text-white/70 hover:text-white hover:bg-white/5 transition"
            >
              <X className="h-4 w-4"/>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function RealTestimonials({ compact = false }) {
  const [active, setActive] = useState(null)

  const featured = TESTIMONIALS[0]
  const rest = TESTIMONIALS.slice(1)
  const shown = compact ? rest.slice(0, 3) : rest

  return (
    <section className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#D4AF37]">
          <ShieldCheck className="h-3 w-3"/>Real students · Real scholarships
        </span>
        <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight text-white">
          They won. On camera.
        </h2>
        <p className="mt-3 text-base md:text-lg text-white/60">
          Four verified scholarship winners from Uzbekistan share their stories — full stipends and tuition at Qatar University, University of Calgary, Université de Bordeaux, and University of Wisconsin-Madison.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 text-[11px] text-white/50">
          <Volume2 className="h-3.5 w-3.5 text-[#D4AF37]/70"/>
          <span>Click any video to play with sound</span>
        </div>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3 md:auto-rows-fr">
        <VideoCard t={featured} featured onOpen={setActive}/>
        {shown.map((t) => (
          <VideoCard key={t.id} t={t} onOpen={setActive}/>
        ))}
      </div>

      {compact && (
        <div className="mt-8 flex justify-center">
          <a
            href="/testimonials"
            className="inline-flex items-center gap-2 text-sm text-[#D4AF37] hover:text-[#F5D67B] underline underline-offset-4"
          >
            Watch every winner&rsquo;s story →
          </a>
        </div>
      )}

      <VideoLightbox testimonial={active} onClose={() => setActive(null)}/>
    </section>
  )
}
