import LegalPageShell from '@/components/site/LegalPageShell'

export const metadata = {
  title: 'Privacy Policy — ScholarshipFit',
  description: 'How ScholarshipFit collects, uses, stores, and protects your personal information. Fully GDPR / UK GDPR / CCPA compliant.',
}

export default function PrivacyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      subtitle="How we collect, use, protect, and share your personal information."
      updated="7 July 2026"
    >
      <h2>1. Who we are</h2>
      <p>ScholarshipFit is an AI-powered scholarship research and matching service operated by <strong>ScholarshipFit Ltd</strong>, a company registered in the Republic of Uzbekistan (&ldquo;<strong>ScholarshipFit</strong>&rdquo;, &ldquo;<strong>we</strong>&rdquo;, &ldquo;<strong>us</strong>&rdquo;, or &ldquo;<strong>our</strong>&rdquo;). We are the data controller for the personal data described in this policy. You can contact us at <a href="mailto:legal@scholarshipfit.com">legal@scholarshipfit.com</a>.</p>

      <h2>2. What information we collect</h2>
      <p>We collect the following categories of personal data:</p>
      <ul>
        <li><strong>Account information</strong>: name, email address, and (for email/password accounts) a hashed password. If you sign in with Google, we also receive your Google account name, email, and profile picture.</li>
        <li><strong>Academic profile</strong>: nationality, country of residence, degree level, intended major, GPA, standardized test scores (IELTS, TOEFL, SAT, ACT, GRE), achievements, and preferences you enter when building your profile.</li>
        <li><strong>Uploaded documents</strong>: text extracted from transcripts, essays, and personal statements you upload or paste for the Application Readiness Score feature. We store the extracted text; the original file bytes are discarded after parsing.</li>
        <li><strong>Activity data</strong>: which scholarships you save, ignore, or mark as &ldquo;preparing&rdquo;; matches and readiness scores generated for you; contact / waitlist / pre-order form submissions.</li>
        <li><strong>Technical data</strong>: your IP address, browser type, device identifiers, session cookie, referrer URL, and pages viewed. Collected automatically for security, fraud prevention, and service reliability.</li>
        <li><strong>Communications</strong>: any messages you send us via email or contact forms.</li>
      </ul>
      <p>We do <strong>not</strong> knowingly collect: government identification numbers, financial account numbers, health information, biometric data, precise geolocation, or content from third-party accounts beyond the OAuth basics listed above.</p>

      <h2>3. Legal bases for processing (GDPR / UK GDPR)</h2>
      <p>Where GDPR or UK GDPR applies to you, we rely on the following legal bases:</p>
      <ul>
        <li><strong>Performance of a contract</strong> — to create your account, run the AI match, generate readiness scores, store your cabinet, and provide paid features.</li>
        <li><strong>Legitimate interests</strong> — to secure the service, prevent fraud, improve product quality, and communicate service-related updates. We balance these interests against your privacy rights.</li>
        <li><strong>Consent</strong> — for optional communications (product updates, tips) and any future marketing or analytics cookies. You can withdraw consent at any time.</li>
        <li><strong>Legal obligation</strong> — to comply with applicable laws, respond to lawful requests, and enforce our Terms.</li>
      </ul>

      <h2>4. How we use your information</h2>
      <ul>
        <li>To run the AI shortlist and rank scholarships against your profile.</li>
        <li>To generate Application Readiness Scores using your profile and uploaded documents.</li>
        <li>To maintain your cabinet (favorites, saved documents, application status).</li>
        <li>To send transactional emails (verification, password reset, deadline reminders you opt into).</li>
        <li>To detect and prevent abuse, spam, scraping, and fraud.</li>
        <li>To improve the accuracy of matching and to expand our scholarship database.</li>
        <li>To comply with legal obligations and enforce our Terms of Service.</li>
      </ul>

      <h2>5. Automated decision-making and AI</h2>
      <p>The AI Match, Application Readiness Score, and AI Advisor use large language models (currently Anthropic Claude, provided via the Emergent LLM Gateway) to analyze your profile and any documents you provide. These outputs are <strong>decision-support signals only</strong>; they do not produce legal effects or significantly similar effects on you. You are free to disregard our outputs at any time. You may request a human review of any AI output by contacting <a href="mailto:legal@scholarshipfit.com">legal@scholarshipfit.com</a>.</p>

      <h2>6. Sharing your information (sub-processors)</h2>
      <p>We do <strong>not</strong> sell or rent your personal information. We share limited information with a small number of trusted service providers who help us operate the platform. A current, human-readable list is maintained on our <a href="/dpa">Data Processing &amp; Sub-processors</a> page and includes:</p>
      <ul>
        <li><strong>MongoDB Atlas</strong> — database hosting.</li>
        <li><strong>Anthropic (via Emergent LLM Gateway)</strong> — AI inference for matching, readiness, and the advisor.</li>
        <li><strong>Google LLC</strong> — Sign-in with Google (OAuth 2.0) for authentication.</li>
        <li><strong>Emergent</strong> — application hosting and infrastructure.</li>
      </ul>
      <p>We may also disclose personal data (a) to comply with law or a lawful request; (b) to enforce our Terms; (c) to protect the rights, property, or safety of ScholarshipFit, our users, or the public; (d) in connection with a corporate transaction (merger, acquisition, sale of assets), with reasonable safeguards.</p>

      <h2>7. International data transfers</h2>
      <p>Your data may be processed in countries outside your own, including the United States and the European Union. When we transfer personal data from the EEA, UK, or Switzerland to a country not deemed to provide an adequate level of protection, we rely on appropriate safeguards, including the European Commission&rsquo;s Standard Contractual Clauses (SCCs) with each sub-processor.</p>

      <h2>8. How long we keep your data</h2>
      <ul>
        <li><strong>Account data</strong>: until you delete your account, plus up to 90 days in secure backups.</li>
        <li><strong>Uploaded document text</strong>: until you remove it from your cabinet, or you delete your account.</li>
        <li><strong>AI cache entries</strong>: 7 days, then automatically expired.</li>
        <li><strong>Contact / waitlist submissions</strong>: 24 months.</li>
        <li><strong>Server access logs</strong>: 90 days.</li>
      </ul>

      <h2>9. Your privacy rights</h2>
      <p>Depending on your location, you may have the following rights:</p>
      <ul>
        <li><strong>Access</strong> — request a copy of the personal data we hold about you.</li>
        <li><strong>Rectification</strong> — correct inaccurate or incomplete data.</li>
        <li><strong>Erasure</strong> (&ldquo;right to be forgotten&rdquo;) — delete your data.</li>
        <li><strong>Portability</strong> — receive your data in a machine-readable format.</li>
        <li><strong>Restriction</strong> — limit how we process your data.</li>
        <li><strong>Objection</strong> — object to processing based on legitimate interests.</li>
        <li><strong>Withdraw consent</strong> — for any processing based on your consent.</li>
        <li><strong>Lodge a complaint</strong> with your local supervisory authority (e.g. an EU DPA, or the UK ICO).</li>
      </ul>
      <p><strong>California residents (CCPA / CPRA)</strong>: you additionally have the right to know what personal information is collected, sold, or shared; the right to delete; the right to correct; the right to opt out of sale or sharing of personal information (we do not sell or share your personal information as those terms are defined by California law); and the right to non-discrimination for exercising your rights.</p>
      <p>To exercise any right, email <a href="mailto:legal@scholarshipfit.com">legal@scholarshipfit.com</a>. We will respond within 30 days (or 45 days for CCPA requests, with a possible 45-day extension).</p>

      <h2>10. Cookies and tracking</h2>
      <p>ScholarshipFit uses only <strong>strictly necessary</strong> cookies at this time: a signed session cookie (<code>sf_session</code>) to keep you signed in, and technical cookies required for the site to function. We do not currently use analytics, advertising, or third-party tracking cookies. If we add any in the future, we will update this policy and present a granular consent banner before setting them. See our <a href="/legal#cookies">cookie information</a> for details.</p>

      <h2>11. Children</h2>
      <p>ScholarshipFit is not intended for children under 16. We do not knowingly collect personal information from anyone under 16. If you believe we have collected data from a child under 16, contact us and we will delete it.</p>

      <h2>12. Security</h2>
      <p>We use industry-standard safeguards including encryption in transit (TLS 1.3), hashed passwords (bcrypt), signed session tokens (JOSE / JWT), least-privilege database access, and regular dependency patching. No system is 100% secure; you are responsible for keeping your password confidential.</p>

      <h2>13. Changes to this policy</h2>
      <p>We may update this Privacy Policy from time to time. Material changes will be announced via email or an in-app banner at least 14 days before they take effect. The &ldquo;Last updated&rdquo; date at the top of this page indicates when the current version was published.</p>

      <h2>14. Contact</h2>
      <p>ScholarshipFit Ltd &middot; Republic of Uzbekistan &middot; <a href="mailto:legal@scholarshipfit.com">legal@scholarshipfit.com</a></p>
    </LegalPageShell>
  )
}
