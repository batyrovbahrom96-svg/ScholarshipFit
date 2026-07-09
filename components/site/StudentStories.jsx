'use client'
import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
  Play, ShieldCheck, X, GraduationCap, MapPin, Info, Lock, Sparkles, Quote, Wallet,
} from 'lucide-react'

/* ================================================================
   StudentStories — the honest "outcomes" section
   ---------------------------------------------------------------
   Copy strictly authored by the founder. We do NOT claim ScholarshipFit
   got them the scholarship. Each card explicitly says the student
   "used ScholarshipFit during their research process". Every card
   carries an individual disclaimer + trust note; the section carries
   a global disclaimer.
   ---------------------------------------------------------------
   Video assets are streamed from the Emergent CDN (kept out of /public
   to keep deploys lean). PNG thumbnails live in /public/outcomes/.
   ================================================================ */

const CDN = 'https://customer-assets.emergentagent.com/job_stellar-fit/artifacts'

const STORIES = [
  {
    id: 'jurabek',
    name: 'Jurabek Maxmudov',
    country: 'Azerbaijan',
    school: 'Qatar University',
    location: 'Doha, Qatar',
    outcome: 'Received a scholarship offer',
    funding: '20,000 USD',
    proof: 'Proof reviewed internally',
    quote: 'Persistence beats temptation.',
    videoUrl: `${CDN}/p6u66bir_jurabek-maxmudov-qatar-university-scholarship.mov`,
    poster: '/outcomes/jurabek-maxmudov-qatar-university-scholarship.png',
    help: 'Jurabek used ScholarshipFit during his scholarship research process to organize source-linked opportunities, compare funding notes, and keep official application information in one place. His Qatar University scholarship offer was later reviewed internally by the ScholarshipFit team.',
    disclaimer: 'Individual result. ScholarshipFit does not guarantee similar outcomes.',
  },
  {
    id: 'shohrux',
    name: 'Shohrux Ziyodullayev',
    country: 'Turkey',
    school: 'University of Calgary',
    location: 'Calgary, Canada',
    outcome: 'Received a scholarship offer',
    funding: '27,000 USD',
    proof: 'Proof reviewed internally',
    quote: 'Impossible is possible.',
    videoUrl: `${CDN}/s3lgmfm5_shohrux-ziyodullayev-university-of-calgary-scholarship.mov`,
    poster: '/outcomes/shohrux-ziyodullayev-university-of-calgary-scholarship.png',
    help: 'Shohrux used ScholarshipFit during his research to compare international scholarship options, understand funding context, and keep source-linked information organized before applying through official channels. His University of Calgary scholarship offer was reviewed internally.',
    disclaimer: 'Individual result. ScholarshipFit does not guarantee similar outcomes.',
  },
  {
    id: 'arina',
    name: 'Arina Pak',
    country: 'Republic of Korea',
    school: 'Universit\u00E9 de Bordeaux',
    location: 'Bordeaux, France',
    outcome: 'Received a scholarship offer',
    funding: '1,500 EUR / month',
    proof: 'Proof reviewed internally',
    quote: 'Faith is only what I have.',
    videoUrl: `${CDN}/z4zfmtj9_arina-pak-universite-de-bordeaux-stipend.mp4`,
    poster: '/outcomes/arina-pak-universite-de-bordeaux-stipend.png',
    help: 'Arina used ScholarshipFit during her scholarship research process to organize European funding options, compare source-linked records, and track scholarship details more clearly. Her Universit\u00E9 de Bordeaux monthly stipend outcome was reviewed internally.',
    disclaimer: 'Individual result. ScholarshipFit does not guarantee similar outcomes.',
  },
  {
    id: 'jasur',
    name: 'Jasur Yaxshilikov',
    country: 'Republic of Uzbekistan',
    school: 'University of Wisconsin-Madison',
    location: 'Madison, USA',
    outcome: 'Received a scholarship offer',
    funding: '29,000 USD',
    proof: 'Proof reviewed internally',
    quote: 'Person\u2019s superiority is one\u2019s intelligence.',
    videoUrl: `${CDN}/lnfwf9u4_jasur-yaxshilikov-university-of-wisconsin-madison-scholarship.mov`,
    poster: '/outcomes/jasur-yaxshilikov-university-of-wisconsin-madison-scholarship.png',
    help: 'Jasur used ScholarshipFit during his research for competitive U.S. scholarship opportunities. ScholarshipFit helped organize source-linked records, funding information, and fit signals before he continued through official application channels. His University of Wisconsin-Madison scholarship offer was reviewed internally.',
    disclaimer: 'Individual result. ScholarshipFit does not guarantee similar outcomes.',
  },
]

const GLOBAL_DISCLAIMER = 'Outcomes reflect individual user experiences. ScholarshipFit does not guarantee admission, scholarships, visas, or funding. Users apply directly through official university or scholarship provider websites.'

/* ---------- cosmos background flourishes ---------- */
function CosmosBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Deep space gradient blobs */}
      <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(120,90,240,0.20),transparent_70%)] blur-3xl"/>
      <div className="absolute top-20 right-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.15),transparent_70%)] blur-3xl"/>
      <div className="absolute bottom-0 left-0 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(60,110,200,0.14),transparent_70%)] blur-3xl"/>
      {/* Star grid overlay */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.14]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="stars" x="0" y="0" width="42" height="42" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.6" fill="#ffffff"/>
            <circle cx="20" cy="12" r="0.4" fill="#F5D67B"/>
            <circle cx="35" cy="28" r="0.35" fill="#ffffff"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#stars)"/>
      </svg>
    </div>
  )
}

function ProofBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-emerald-300 font-semibold">
      <ShieldCheck className="h-3 w-3"/>Proof reviewed internally
    </span>
  )
}

function FundingBadge({ amount }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/40 bg-gradient-to-r from-[#D4AF37]/20 to-[#F5D67B]/10 px-3 py-1 text-xs font-semibold text-[#F5D67B]">
      <Wallet className="h-3.5 w-3.5"/>{amount}
    </span>
  )
}

/* ---------- Story card ---------- */
function StoryCard({ s, featured = false, onOpen }) {
  return (
    <Card
      className={`group relative overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.01] hover:border-[#D4AF37]/35 transition duration-300
        ${featured ? 'md:col-span-2 md:row-span-2' : ''}`}
    >
      <CardContent className="p-0">
        {/* Poster + play overlay */}
        <button
          type="button"
          onClick={() => onOpen(s)}
          className="relative block w-full text-left"
          aria-label={`Play ${s.name}'s story`}
        >
          <div className={`relative w-full ${featured ? 'aspect-[16/10]' : 'aspect-video'} overflow-hidden bg-neutral-950`}>
            <img
              src={s.poster}
              alt={`${s.name} — ${s.school}`}
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
            {/* Cosmos veil */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10"/>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.55)_100%)]"/>
            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`flex items-center justify-center rounded-full bg-[#D4AF37] shadow-[0_0_80px_-10px_rgba(212,175,55,0.7)] ring-4 ring-[#D4AF37]/25 transition group-hover:scale-110
                ${featured ? 'h-20 w-20' : 'h-14 w-14'}`}>
                <Play className={`text-black fill-black ${featured ? 'h-8 w-8' : 'h-5 w-5'} ml-1`}/>
              </div>
            </div>
            {/* Top-left proof + funding chips */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
              <ProofBadge/>
              <FundingBadge amount={s.funding}/>
            </div>
            {/* Bottom label */}
            <div className={`absolute inset-x-0 bottom-0 p-4 ${featured ? 'md:p-6' : ''}`}>
              <p className={`text-white font-semibold ${featured ? 'text-2xl md:text-3xl' : 'text-lg'}`}>{s.name}</p>
              <div className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-white/85 ${featured ? 'text-sm md:text-[15px]' : 'text-xs'}`}>
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-[#D4AF37]"/>From {s.country}</span>
                <span className="inline-flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5 text-[#D4AF37]"/>{s.school}</span>
              </div>
            </div>
          </div>
        </button>

        {/* Text block below poster */}
        <div className={`space-y-4 p-5 ${featured ? 'md:p-7' : ''}`}>
          {/* Quote */}
          <blockquote className="relative">
            <Quote className={`absolute -left-1 -top-1 text-[#D4AF37]/40 ${featured ? 'h-6 w-6' : 'h-5 w-5'}`}/>
            <p className={`pl-6 italic text-white/85 ${featured ? 'text-lg' : 'text-[14px]'}`}>
              &ldquo;{s.quote}&rdquo;
            </p>
          </blockquote>

          {/* Outcome + funding */}
          <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#D4AF37]/80 font-semibold">Reported outcome</p>
            <p className="mt-1 text-sm text-white/90">{s.outcome} · {s.location}</p>
            <p className="mt-1.5 text-[12px] text-white/55">Funding value: <span className="text-white font-medium">{s.funding}</span></p>
          </div>

          {/* How ScholarshipFit helped */}
          <div>
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[#D4AF37]/80 font-semibold">
              <Sparkles className="h-3 w-3"/>How ScholarshipFit helped
            </div>
            <p className={`mt-1.5 text-white/75 leading-relaxed ${featured ? 'text-[14px]' : 'text-[13px]'}`}>
              {s.help}
            </p>
          </div>

          {/* Trust footer */}
          <div className="border-t border-white/8 pt-3.5 space-y-1.5">
            <p className="flex items-start gap-1.5 text-[11px] text-white/50">
              <Lock className="h-3 w-3 shrink-0 mt-0.5 text-white/40"/>
              <span>Private offer documents are not shown publicly.</span>
            </p>
            <p className="flex items-start gap-1.5 text-[11px] text-white/45">
              <Info className="h-3 w-3 shrink-0 mt-0.5 text-white/35"/>
              <span>{s.disclaimer}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ---------- Video lightbox ---------- */
function StoryLightbox({ story, onClose }) {
  const videoRef = useRef(null)
  const open = !!story

  useEffect(() => {
    if (open && videoRef.current) {
      const v = videoRef.current
      v.currentTime = 0
      v.play().catch(() => { /* autoplay may be blocked */ })
    }
  }, [open, story?.id])

  if (!story) return null

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl border-[#D4AF37]/25 bg-black/95 p-0 overflow-hidden">
        <DialogTitle className="sr-only">{story.name} — {story.school}</DialogTitle>
        <div className="relative aspect-video w-full bg-black">
          <video
            ref={videoRef}
            key={story.id}
            className="h-full w-full object-contain"
            controls
            playsInline
            preload="auto"
            poster={story.poster}
          >
            <source src={story.videoUrl} type="video/mp4"/>
            Your browser doesn&rsquo;t support HTML5 video.
          </video>
        </div>
        <div className="border-t border-white/10 bg-black p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-lg md:text-xl font-semibold text-white">{story.name}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/70">
                <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4 text-[#D4AF37]"/>From {story.country}</span>
                <span className="inline-flex items-center gap-1"><GraduationCap className="h-4 w-4 text-[#D4AF37]"/>{story.school}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <ProofBadge/>
                <FundingBadge amount={story.funding}/>
              </div>
              <p className="mt-3 text-[11px] text-white/45 max-w-md">{story.disclaimer}</p>
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

export default function StudentStories({ compact = false }) {
  const [active, setActive] = useState(null)
  const featured = STORIES[0]
  const rest = STORIES.slice(1)
  const shown = compact ? rest.slice(0, 3) : rest

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <CosmosBackground />
      <div className="container relative mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#D4AF37]">
            <Sparkles className="h-3 w-3"/>Student Stories
          </span>
          <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight text-white">
            ScholarshipFit <span className="text-gold">Student Stories</span>
          </h2>
          <p className="mt-3 text-base md:text-lg text-white/60">
            Real stories from students who used ScholarshipFit during their scholarship research process and later reported scholarship offers.
          </p>
        </div>

        {/* Global disclaimer (visible above the video grid) */}
        <div className="mx-auto mt-8 max-w-3xl">
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <ShieldCheck className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5"/>
            <p className="text-[12px] leading-relaxed text-white/55">
              {GLOBAL_DISCLAIMER}
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3 md:auto-rows-fr">
          <StoryCard s={featured} featured onOpen={setActive}/>
          {shown.map((s) => (
            <StoryCard key={s.id} s={s} onOpen={setActive}/>
          ))}
        </div>

        {compact && (
          <div className="mt-10 flex justify-center">
            <a
              href="/testimonials"
              className="inline-flex items-center gap-2 text-sm text-[#D4AF37] hover:text-[#F5D67B] underline underline-offset-4"
            >
              See every student story &rarr;
            </a>
          </div>
        )}

        <StoryLightbox story={active} onClose={() => setActive(null)}/>
      </div>
    </section>
  )
}
