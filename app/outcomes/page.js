'use client'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Globe2, ShieldCheck } from 'lucide-react'

function Outcomes() {
  return (
    <div className="dark-bg min-h-screen">
      <Navbar />
      <div className="container mx-auto max-w-4xl px-4 py-14">
        <Badge variant="outline" className="border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#F5D67B]">Outcomes</Badge>
        <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-white">Verified student outcomes</h1>
        <p className="mt-2 text-white/60">We only publish outcomes with explicit permission from the student. No stock testimonials. No fake photos.</p>

        <Card className="mt-8 border-white/10 bg-white/[0.03]">
          <CardContent className="p-10 text-center">
            <Globe2 className="mx-auto h-8 w-8 text-[#D4AF37]"/>
            <p className="mt-3 text-lg text-white">No verified outcomes to display yet.</p>
            <p className="mt-1 text-sm text-white/40">Won a scholarship using ScholarshipFit? Contact us and we’ll publish your story with proof-of-award, only after your written consent.</p>
            <p className="mt-6 text-xs text-white/40">Individual results vary. ScholarshipFit does not guarantee similar outcomes.</p>
          </CardContent>
        </Card>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card className="border-white/10 bg-white/[0.03]">
            <CardContent className="p-5">
              <p className="text-[11px] uppercase tracking-widest text-[#D4AF37]">Every outcome must include</p>
              <ul className="mt-2 space-y-1 text-sm text-white/80 [&>li]:list-disc [&>li]:ml-5">
                <li>Student name or approved label</li>
                <li>Country and university/program</li>
                <li>Scholarship / funding awarded</li>
                <li>Proof-of-award status</li>
                <li>Direct quote from the student</li>
                <li>Optional photo/video with consent</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/[0.03]">
            <CardContent className="p-5">
              <p className="text-[11px] uppercase tracking-widest text-[#D4AF37]">Our commitment</p>
              <p className="mt-2 text-sm text-white/80">ScholarshipFit will never fabricate testimonials, invent universities, or pretend to have outcomes we can’t prove. If you spot a claim you can’t verify, please <a className="text-[#D4AF37] underline" href="/contact">tell us</a>.</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300"><ShieldCheck className="h-3 w-3"/>Consent-based publishing</div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Outcomes
