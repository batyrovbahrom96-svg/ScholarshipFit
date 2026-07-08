'use client'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

function About() {
  return (
    <div className="dark-bg min-h-screen">
      <Navbar />
      <div className="container mx-auto max-w-4xl px-4 py-14">
        <Badge variant="outline" className="border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#F5D67B]">About</Badge>
        <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-white">Scholarship research, honestly done</h1>
        <p className="mt-2 text-white/60 max-w-2xl">ScholarshipFit is built for international students who are tired of scholarship blogs full of dead links, invented deadlines, and fake outcomes.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card className="border-white/10 bg-white/[0.03]"><CardContent className="p-6">
            <p className="text-lg font-semibold text-white">What we do</p>
            <p className="mt-2 text-sm text-white/80">We collect scholarships from official university and government portals, store the source URL alongside every record, and use Claude Sonnet 4.5 to explain fit — grounded in what the source actually says.</p>
          </CardContent></Card>
          <Card className="border-white/10 bg-white/[0.03]"><CardContent className="p-6">
            <p className="text-lg font-semibold text-white">What we don’t do</p>
            <p className="mt-2 text-sm text-white/80">We don’t submit applications for you, we don’t promise scholarships, and we don’t invent deadlines. We’re a research accelerator — the final decision, verification, and application are always yours.</p>
          </CardContent></Card>
        </div>

        <Card className="mt-4 border-white/10 bg-white/[0.03]"><CardContent className="p-6">
          <p className="text-lg font-semibold text-white">Principles</p>
          <ul className="mt-3 space-y-1 text-sm text-white/80 [&>li]:list-disc [&>li]:ml-6">
            <li>Source-linked by default — no source, no publication.</li>
            <li>Never invent scholarships, deadlines, funding amounts, or eligibility rules.</li>
            <li>Never publish a testimonial without written consent from the student.</li>
            <li>Always link users out to the official provider for the actual application.</li>
          </ul>
        </CardContent></Card>
      </div>
      <Footer />
    </div>
  )
}

export default About
