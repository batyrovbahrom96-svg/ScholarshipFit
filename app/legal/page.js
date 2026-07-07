'use client'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

function Legal() {
  return (
    <div className="paper-bg min-h-screen">
      <Navbar />
      <div className="container mx-auto max-w-4xl px-4 py-14">
        <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-800">Legal</Badge>
        <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-[#0A0A0A]">Terms, Privacy, Disclaimer & Refund policy</h1>
        <p className="mt-2 text-[#6B6357]">Plain-language, honest legal notes for ScholarshipFit.</p>

        <Block id="disclaimer" title="Disclaimer">
          <p>ScholarshipFit is self-service scholarship research software. It does <strong>not</strong> provide admissions consulting, visa services, legal advice, financial advice, application submission, or guaranteed outcomes. All matches are informational. Users must verify eligibility, deadlines, and funding terms directly on the official provider website before applying.</p>
        </Block>

        <Block id="terms" title="Terms of Service">
          <p>By using ScholarshipFit you agree to use the product only as an informational research tool, not as a substitute for the official provider’s eligibility check. You agree not to scrape, resell, or misrepresent our data. We may update the database, matching logic, and product features at any time. We may hide or remove records that no longer meet our source-linked standard.</p>
        </Block>

        <Block id="privacy" title="Privacy">
          <p>We store the profile information you enter (name, academic details, preferences) to power your ScholarshipFit cabinet and AI shortlist. We may retain anonymised aggregate metrics to improve the product. We do not sell personal data. You can request deletion of your profile at any time by contacting us.</p>
        </Block>

        <Block id="refund" title="Refund policy (placeholder)">
          <p>Paid plans are not active yet. When paid plans open, our default policy will be: 7-day money-back guarantee on first subscription; no refunds on renewals; refunds handled on a case-by-case basis for genuine service issues. Final refund policy will be published before payments launch.</p>
        </Block>

        <p className="mt-8 text-xs text-[#8a8171]">Nothing on this site constitutes legal or financial advice. Individual results vary. ScholarshipFit does not guarantee similar outcomes.</p>
      </div>
      <Footer />
    </div>
  )
}

function Block({ id, title, children }) {
  return (
    <Card id={id} className="mt-6 border-[#E8E3D6] bg-white scroll-mt-24">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-[#0A0A0A]">{title}</h2>
        <div className="mt-2 text-sm text-[#4b453b] leading-relaxed">{children}</div>
      </CardContent>
    </Card>
  )
}

export default Legal
