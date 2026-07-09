import LegalPageShell from '@/components/site/LegalPageShell'

export const metadata = {
  title: 'DMCA & Abuse Reporting — ScholarshipFit',
  description: 'How to submit a DMCA takedown notice, report abuse, or contact ScholarshipFit\u2019s trust and safety team.',
}

export default function DMCAPage() {
  return (
    <LegalPageShell
      title="DMCA & Abuse Reporting"
      subtitle="How to notify us of copyright infringement, fraud, impersonation, or other abuse of the Service."
      updated="7 July 2026"
    >
      <h2>1. Overview</h2>
      <p>ScholarshipFit respects the intellectual-property rights of others and expects users of the Service to do the same. We respond to notices of alleged copyright infringement that comply with the U.S. Digital Millennium Copyright Act (17 U.S.C. &sect; 512) and equivalent laws in other jurisdictions. We also investigate other categories of abuse (fraud, impersonation, spam, harassment).</p>

      <h2>2. Where to send DMCA notices</h2>
      <p>Designated agent for copyright complaints:</p>
      <ul>
        <li><strong>By email (fastest):</strong> <a href="mailto:legal@scholarshipfit.com?subject=DMCA%20Takedown">legal@scholarshipfit.com</a></li>
        <li><strong>Subject line:</strong> &ldquo;DMCA Takedown Notice&rdquo;</li>
        <li><strong>Company:</strong> ScholarshipFit Ltd, Republic of Uzbekistan</li>
      </ul>
      <p>False or bad-faith DMCA notices are a violation of U.S. federal law and may result in liability for damages, court costs, and attorneys&rsquo; fees.</p>

      <h2>3. What a DMCA takedown notice must include</h2>
      <p>To be effective, your notice must contain <strong>all</strong> of the following:</p>
      <ol>
        <li>A physical or electronic signature of the copyright owner or a person authorised to act on their behalf.</li>
        <li>Identification of the copyrighted work claimed to have been infringed (or, if multiple works are covered by a single notification, a representative list of such works).</li>
        <li>Identification of the material that is claimed to be infringing and information reasonably sufficient to allow us to locate it (a direct URL is best).</li>
        <li>Contact information (address, telephone number, and email address).</li>
        <li>A statement that you have a good-faith belief that use of the material is not authorised by the copyright owner, its agent, or the law.</li>
        <li>A statement, under penalty of perjury, that the information in the notification is accurate and that you are the copyright owner or authorised to act on the owner&rsquo;s behalf.</li>
      </ol>

      <h2>4. Counter-notice procedure</h2>
      <p>If you believe material you posted was removed or disabled by mistake or misidentification, you may submit a counter-notice containing:</p>
      <ol>
        <li>Your physical or electronic signature.</li>
        <li>Identification of the material that was removed and the location where it appeared before removal.</li>
        <li>A statement under penalty of perjury that you have a good-faith belief the material was removed by mistake or misidentification.</li>
        <li>Your name, address, and telephone number, and a statement that you consent to the jurisdiction of the U.S. federal court for the district where you reside (or, if outside the United States, for the District of Delaware) and that you will accept service of process from the party who filed the original notice.</li>
      </ol>
      <p>If we receive a valid counter-notice, we may restore the material 10-14 business days after receipt unless the original complainant notifies us that they have filed a court action seeking an injunction.</p>

      <h2>5. Repeat infringers</h2>
      <p>In appropriate circumstances, we will terminate the accounts of users who are found to be repeat infringers of copyright.</p>

      <h2>6. Non-copyright abuse</h2>
      <p>To report content or behaviour that violates our <a href="/terms">Terms of Service</a> for reasons other than copyright &mdash; including fraud, impersonation, spam, harassment, scam scholarship listings, or safety concerns &mdash; please email <a href="mailto:legal@scholarshipfit.com?subject=Abuse%20Report">legal@scholarshipfit.com</a> with the subject &ldquo;Abuse Report&rdquo; and include:</p>
      <ul>
        <li>A description of the issue.</li>
        <li>URLs, screenshots, or other supporting information.</li>
        <li>Your contact details (we treat these confidentially where possible).</li>
      </ul>
      <p>We aim to acknowledge abuse reports within 3 business days and to complete our review within 10 business days, though complex investigations may take longer.</p>

      <h2>7. Emergency contact</h2>
      <p>For imminent risk-of-harm reports (for example, a user threatening self-harm or harm to others), please contact your local emergency services first, and then email <a href="mailto:legal@scholarshipfit.com?subject=URGENT%20Safety">legal@scholarshipfit.com</a> with &ldquo;URGENT Safety&rdquo; in the subject line.</p>

      <h2>8. Contact</h2>
      <p>ScholarshipFit Ltd &middot; Republic of Uzbekistan &middot; <a href="mailto:legal@scholarshipfit.com">legal@scholarshipfit.com</a></p>
    </LegalPageShell>
  )
}
