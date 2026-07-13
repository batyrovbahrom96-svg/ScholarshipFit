import Link from 'next/link'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Bot, ShieldCheck, XCircle, CheckCircle2, ArrowRight, FileText, Info, Search, PenLine, Building } from 'lucide-react'

export const metadata = {
  title: 'How Our AI Works — ScholarshipFit',
  description: 'Full transparency: exactly what our AI features do, what they do not do, and how you stay in control of every application decision.',
  alternates: { canonical: 'https://scholarshipfit.com/how-our-ai-works' },
}

export default function HowOurAIWorksPage() {
  return (
    <div className="min-h-screen bg-[#05070A] text-white">
      <Navbar />

      <main className="container mx-auto max-w-4xl px-4 py-12 md:py-16">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[11px] uppercase tracking-widest text-[#E7C766]">
            <ShieldCheck className="h-3 w-3"/> Full transparency
          </div>
          <h1 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight leading-tight">
            How our AI is{' '}
            <span className="bg-gradient-to-b from-white via-[#F0D77A] to-[#D4AF37] bg-clip-text text-transparent">actually used.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-white/60 leading-relaxed">
            ScholarshipFit uses AI to help you research scholarships. That&apos;s it.
            No AI on our platform makes admissions decisions, evaluates you as a
            candidate, or communicates with any scholarship provider on your behalf.
            Every application decision stays with you, and every admissions decision
            stays with the scholarship provider.
          </p>
        </div>

        {/* Plain-english summary */}
        <div className="grid gap-4 md:grid-cols-2 mb-12">
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.04] p-6">
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5"/> What our AI does
            </div>
            <ul className="mt-4 space-y-2.5 text-sm text-white/80 leading-relaxed">
              <li className="flex items-start gap-2"><span className="text-emerald-400 shrink-0">✓</span> Organizes publicly-available scholarship data (800 hand-verified programs).</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 shrink-0">✓</span> Filters our database to surface scholarships matching your self-reported profile.</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 shrink-0">✓</span> Answers factual questions about program requirements, deadlines, and application steps.</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 shrink-0">✓</span> Drafts essay outlines you can edit, keep, discard, or ignore.</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 shrink-0">✓</span> Reminds you of deadlines you&apos;ve chosen to track.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-red-400/25 bg-red-400/[0.04] p-6">
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-red-300">
              <XCircle className="h-3.5 w-3.5"/> What our AI never does
            </div>
            <ul className="mt-4 space-y-2.5 text-sm text-white/80 leading-relaxed">
              <li className="flex items-start gap-2"><span className="text-red-400 shrink-0">✗</span> Make any scholarship admissions decision.</li>
              <li className="flex items-start gap-2"><span className="text-red-400 shrink-0">✗</span> Grade, score, or evaluate you as a candidate.</li>
              <li className="flex items-start gap-2"><span className="text-red-400 shrink-0">✗</span> Communicate with any scholarship provider on your behalf.</li>
              <li className="flex items-start gap-2"><span className="text-red-400 shrink-0">✗</span> Submit an application to any scholarship on your behalf.</li>
              <li className="flex items-start gap-2"><span className="text-red-400 shrink-0">✗</span> Reject you from anything or restrict your access based on your profile.</li>
            </ul>
          </div>
        </div>

        {/* Feature-by-feature disclosure */}
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold mb-6">Feature-by-feature disclosure</h2>

          <FeatureBlock
            icon={Search}
            title="1. Scholarship match filter"
            body={
              <>
                <p>This is a <strong>deterministic search filter</strong> — not machine learning, not AI evaluation. When you enter your degree level, target country, nationality, or field, our software runs a database query against our public scholarship metadata and returns matching results.</p>
                <p className="mt-3"><strong className="text-white">The &ldquo;fit score&rdquo; you see is a score of how well a SCHOLARSHIP matches your CRITERIA</strong>, not a score of you as a person. Toggle any input and the score changes instantly. The math is transparent, deterministic, and applies equally to every user.</p>
              </>
            }
          />

          <FeatureBlock
            icon={Bot}
            title="2. Nova AI research assistant"
            body={
              <>
                <p>Nova is a chat assistant powered by Anthropic Claude, grounded in our publicly-available scholarship metadata. You can ask it questions like &ldquo;What scholarships fit my profile?&rdquo; or &ldquo;What&apos;s the Chevening deadline?&rdquo;</p>
                <p className="mt-3">Nova <strong>answers questions</strong>. It does not make decisions. It does not have API access to any scholarship provider&apos;s admissions system. It cannot submit anything on your behalf. If you close the chat, nothing happens.</p>
              </>
            }
          />

          <FeatureBlock
            icon={PenLine}
            title="3. Essay Generator"
            body={
              <>
                <p>You enter your profile, a scholarship, and optionally the scholarship&apos;s essay prompts. The Essay Generator drafts a first-person outline using Anthropic Claude.</p>
                <p className="mt-3"><strong className="text-white">The draft is a starting point.</strong> You review it, edit it, rewrite it, or discard it entirely. When you&apos;re satisfied, you copy the text and submit it to the scholarship provider yourself, through their own official application system. ScholarshipFit never touches your final submission.</p>
              </>
            }
          />

          <FeatureBlock
            icon={FileText}
            title="4. Deadline reminders & application tracker"
            body={
              <>
                <p>You choose which scholarships to save. You choose which to track on your Kanban board. You choose whether to opt into deadline reminder emails.</p>
                <p className="mt-3">These features send email notifications only. They do not act on your behalf, make decisions for you, or affect your standing with any provider.</p>
              </>
            }
          />
        </div>

        {/* Who makes decisions */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8 mb-12">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#D4AF37]">
            <Building className="h-3.5 w-3.5"/> Who actually decides
          </div>
          <h2 className="mt-2 text-xl md:text-2xl font-semibold text-white">Scholarship providers, not us.</h2>
          <p className="mt-3 text-white/70 leading-relaxed">
            All admissions decisions are made independently by the scholarship
            providers themselves (Chevening, DAAD, Fulbright, Erasmus+, Commonwealth,
            and every other program listed on our platform). Each provider operates
            its own application intake, its own review committees, and its own
            selection criteria.
          </p>
          <p className="mt-3 text-white/70 leading-relaxed">
            <strong className="text-white">ScholarshipFit has no relationship, integration, contract, data-sharing
            agreement, or communication channel with any scholarship provider.</strong> We
            do not send your data to them. They do not send data to us. We simply
            organize their publicly-published scholarship information and link back
            to their official application pages.
          </p>
        </div>

        {/* User control */}
        <div className="rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/[0.05] p-6 md:p-8 mb-12">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#E7C766]">
            <ShieldCheck className="h-3.5 w-3.5"/> You are in control
          </div>
          <h2 className="mt-2 text-xl md:text-2xl font-semibold text-white">Every input, every submission, every decision — yours.</h2>
          <ul className="mt-4 space-y-2 text-white/80 leading-relaxed">
            <li className="flex items-start gap-2"><span className="text-[#D4AF37] mt-1">•</span> You enter your own profile data. You can edit or delete it any time.</li>
            <li className="flex items-start gap-2"><span className="text-[#D4AF37] mt-1">•</span> You decide which scholarships to save, apply to, or ignore.</li>
            <li className="flex items-start gap-2"><span className="text-[#D4AF37] mt-1">•</span> You decide whether to use any AI feature at all.</li>
            <li className="flex items-start gap-2"><span className="text-[#D4AF37] mt-1">•</span> You review every essay draft before it exists anywhere outside our platform.</li>
            <li className="flex items-start gap-2"><span className="text-[#D4AF37] mt-1">•</span> You submit every application yourself through the provider&apos;s own website.</li>
            <li className="flex items-start gap-2"><span className="text-[#D4AF37] mt-1">•</span> You can export or delete all your data at any time from your Cabinet.</li>
          </ul>
        </div>

        {/* Compliance notes */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-white/50">
            <Info className="h-3.5 w-3.5"/> Compliance notes
          </div>
          <h2 className="mt-2 text-xl md:text-2xl font-semibold text-white">Regulatory framing.</h2>
          <p className="mt-3 text-white/65 leading-relaxed text-sm">
            ScholarshipFit&apos;s AI features are <strong className="text-white">informational and
            assistive</strong> under a plain reading of GDPR Article 22 and the EU AI Act:
            we do not carry out automated individual decision-making, we do not
            produce legal effects for users, and we do not significantly affect any
            user&apos;s access to educational funding. The scholarship providers make all
            eligibility, ranking, and admission decisions using their own criteria
            and their own review processes. Our platform is a research layer between
            the student and the publicly-available scholarship data.
          </p>
          <p className="mt-3 text-white/65 leading-relaxed text-sm">
            No AI model, on our platform or through any partner, has authority to
            approve, deny, or influence a user&apos;s access to any scholarship.
          </p>
        </div>

        {/* CTAs */}
        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/quiz" className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#E7C766] transition">
            Try the research tool <ArrowRight className="h-4 w-4"/>
          </Link>
          <Link href="/privacy" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm text-white hover:border-white/30 transition">
            Read our privacy policy
          </Link>
          <Link href="/terms" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm text-white hover:border-white/30 transition">
            Terms of service
          </Link>
        </div>

        <div className="mt-8 text-xs text-white/40">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
          Have questions? <Link href="/contact" className="text-white/60 hover:text-white underline decoration-white/20">Contact us</Link>.
        </div>
      </main>

      <Footer />
    </div>
  )
}

function FeatureBlock({ icon: Icon, title, body }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-4">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-[#D4AF37]/20 to-transparent ring-1 ring-[#D4AF37]/30 shrink-0">
          <Icon className="h-4 w-4 text-[#D4AF37]"/>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white text-lg">{title}</h3>
          <div className="mt-2 text-sm text-white/70 leading-relaxed">{body}</div>
        </div>
      </div>
    </div>
  )
}
