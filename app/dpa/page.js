import LegalPageShell from '@/components/site/LegalPageShell'

export const metadata = {
  title: 'Data Processing & Sub-processors — ScholarshipFit',
  description: 'Sub-processor list, data processing safeguards, and DPA information for ScholarshipFit customers.',
}

const SUB_PROCESSORS = [
  { name: 'Anthropic (via Emergent LLM Gateway)', purpose: 'Large-language-model inference for AI Match, Readiness Score, and AI Advisor.', data: 'User profile fields, scholarship record fields, extracted transcript / essay text.', region: 'United States', safeguard: 'Standard Contractual Clauses (SCCs); no training on customer inputs.' },
  { name: 'MongoDB Atlas', purpose: 'Primary application database (accounts, profiles, cabinet, cache).', data: 'All account, profile, cabinet, and cache data.', region: 'AWS US-East (primary); encrypted at rest.', safeguard: 'ISO 27001, SOC 2 Type II, encryption in transit and at rest.' },
  { name: 'Google LLC (Sign-in with Google)', purpose: 'OAuth 2.0 authentication.', data: 'Google account email, name, profile picture URL (only if you sign in with Google).', region: 'Global; per Google Cloud Terms.', safeguard: 'Google Privacy Policy; SCCs for EEA transfers.' },
  { name: 'Emergent (application hosting)', purpose: 'Web hosting, container runtime, TLS termination.', data: 'All data processed by the application; encrypted in transit.', region: 'US.', safeguard: 'DPA and infrastructure security controls.' },
]

export default function DPAPage() {
  return (
    <LegalPageShell
      title="Data Processing & Sub-processors"
      subtitle="How we handle personal data, our sub-processor list, and how to request a formal Data Processing Agreement."
      updated="7 July 2026"
    >
      <h2>1. Overview</h2>
      <p>When you use ScholarshipFit, we act as the <strong>data controller</strong> for your personal data under GDPR / UK GDPR (and equivalent laws in other jurisdictions). If you are a business customer using ScholarshipFit on behalf of end users (for example, a school licensing our platform for students), we may act as a <strong>data processor</strong> for that user data. This page describes both scenarios.</p>

      <h2>2. Sub-processors we use today</h2>
      <p>To operate the Service, we share limited data with the vetted service providers listed below. Each is bound by a written data-processing agreement and, where applicable, EU Standard Contractual Clauses (SCCs).</p>
      <div className="my-6 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.04] text-[10px] uppercase tracking-widest text-white/50">
            <tr>
              <th className="px-4 py-3">Sub-processor</th>
              <th className="px-4 py-3">Purpose</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Region &amp; safeguards</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {SUB_PROCESSORS.map((sp) => (
              <tr key={sp.name}>
                <td className="px-4 py-4 align-top font-semibold text-white">{sp.name}</td>
                <td className="px-4 py-4 align-top text-white/75">{sp.purpose}</td>
                <td className="px-4 py-4 align-top text-white/60">{sp.data}</td>
                <td className="px-4 py-4 align-top text-white/60">{sp.region}<br /><span className="text-[11px] text-white/45">{sp.safeguard}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>3. Notice of new sub-processors</h2>
      <p>We will update this page and, where reasonably possible, provide 30 days&rsquo; advance notice by email to designated privacy contacts before adding a new sub-processor that processes personal data. B2B customers who object to a new sub-processor on reasonable grounds may terminate their subscription for cause within that notice period.</p>

      <h2>4. Security safeguards</h2>
      <ul>
        <li>TLS 1.2+ for all traffic between the client, our servers, and each sub-processor.</li>
        <li>Passwords hashed with bcrypt (cost factor ≥ 10).</li>
        <li>Signed session tokens (JOSE / JWT) with short expiration windows.</li>
        <li>Encryption at rest via managed database and storage providers.</li>
        <li>Least-privilege database access; no engineers have production credentials outside break-glass procedures.</li>
        <li>Automatic dependency scanning and prompt patching of critical vulnerabilities.</li>
        <li>Access logs retained for 90 days.</li>
      </ul>

      <h2>5. AI processing safeguards</h2>
      <p>Data sent to Anthropic through the Emergent LLM Gateway is used <strong>only</strong> to generate the specific response for your request. Anthropic&rsquo;s enterprise terms with Emergent prohibit using customer inputs to train generally-available models. Prompts and outputs are retained by Anthropic for a limited period for abuse monitoring, per their commercial terms. We do not send your uploaded documents to any provider other than the one required to complete the requested analysis.</p>

      <h2>6. International transfers</h2>
      <p>Personal data may be transferred outside your country of residence, including to the United States, in connection with the sub-processors above. Where required, we rely on the European Commission&rsquo;s Standard Contractual Clauses and the UK International Data Transfer Addendum, and we perform Transfer Impact Assessments before onboarding a new sub-processor.</p>

      <h2>7. Data-subject requests</h2>
      <p>Requests for access, rectification, erasure, portability, restriction, or objection should be sent to <a href="mailto:legal@scholarshipfit.com?subject=Privacy%20Request">legal@scholarshipfit.com</a>. Please include the email address on your account and the specific right you are exercising. We respond within 30 days (or 45 days for CCPA requests).</p>

      <h2>8. Requesting a signed DPA</h2>
      <p>B2B customers (schools, consultants, organisations) who require a signed Data Processing Agreement can obtain our template by emailing <a href="mailto:legal@scholarshipfit.com?subject=DPA%20Request">legal@scholarshipfit.com</a>. Our standard DPA incorporates the EU Standard Contractual Clauses (Module 2 or Module 3, as applicable) and the UK IDTA.</p>

      <h2>9. Data-breach notification</h2>
      <p>If we become aware of a personal-data breach that affects your data, we will notify affected users and, where required, the relevant supervisory authority within 72 hours in line with GDPR / UK GDPR obligations.</p>

      <h2>10. Contact</h2>
      <p>ScholarshipFit Ltd &middot; Republic of Uzbekistan &middot; <a href="mailto:legal@scholarshipfit.com">legal@scholarshipfit.com</a></p>
    </LegalPageShell>
  )
}
