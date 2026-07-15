import LegalPageShell from '@/components/site/LegalPageShell'

export const metadata = {
  title: 'Refund Policy — ScholarshipFit',
  description: 'ScholarshipFit\u2019s 30-day money-back guarantee and refund procedures.',
}

export default function RefundsPage() {
  return (
    <LegalPageShell
      title="Refund Policy"
      subtitle="Our 30-day money-back guarantee and how refunds work."
      updated="7 July 2026"
    >
      <h2>1. 30-day money-back guarantee</h2>
      <p>We want you to feel confident about your subscription. If you are dissatisfied for any reason, you may request a <strong>full refund within 14 calendar days</strong> of your first paid subscription payment. This applies to your <em>first</em> paid subscription cycle for any plan (Free plan users have nothing to refund).</p>

      <h2>2. How to request a refund</h2>
      <ol>
        <li>Email <a href="mailto:legal@scholarshipfit.com?subject=Refund%20Request">legal@scholarshipfit.com</a> from the address associated with your account.</li>
        <li>Include the last four characters of the order or payment ID (if you have it) and the reason for the request (optional but helpful for us).</li>
        <li>We&rsquo;ll respond within 5 business days.</li>
      </ol>
      <p>Refunds are issued to the original payment method. Depending on your bank or card issuer, funds typically appear in 5-10 business days.</p>

      <h2>3. What is not refundable</h2>
      <ul>
        <li>Refund requests made <strong>more than 30 days</strong> after the initial payment.</li>
        <li>Renewals of subscriptions after the first cycle. You can cancel any renewal from your account settings at any time; cancellation stops the next billing cycle but does not refund the current one.</li>
        <li>One-off add-on purchases (e.g. concierge essay reviews) once the service has been delivered.</li>
        <li>Accounts terminated for breach of our <a href="/terms">Terms of Service</a>.</li>
      </ul>

      <h2>4. Fair use</h2>
      <p>ScholarshipFit is a small team and we honour refunds in good faith. We reserve the right to decline refund requests that appear to be abusive (for example, repeated sign-up-and-refund cycles, or requests after significant paid feature consumption within the 30-day window). We will always explain our reasoning in writing.</p>

      <h2>5. Consumer statutory rights</h2>
      <p>If you are a consumer resident in the European Union or United Kingdom, you have a statutory 14-day right of withdrawal for online services under the Consumer Rights Directive / UK Consumer Rights Act. This right does not affect our voluntary money-back guarantee above; whichever is more favourable to you applies. In line with those laws, if you request an immediate start to the paid service within the withdrawal period, you expressly waive the right to withdraw once the service has been fully performed.</p>

      <h2>6. Changes to this policy</h2>
      <p>We may update this Refund Policy from time to time. Any changes will apply prospectively and will not affect refunds for payments already made under the previous version of the policy.</p>

      <h2>7. Contact</h2>
      <p>ScholarshipFit Ltd &middot; <a href="mailto:legal@scholarshipfit.com">legal@scholarshipfit.com</a></p>
    </LegalPageShell>
  )
}
