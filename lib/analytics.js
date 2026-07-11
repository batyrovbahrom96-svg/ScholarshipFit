// Client-side PostHog helpers. Safe to import from any client component.
// If PostHog is not initialized (e.g. env var missing), all functions become no-ops.
import posthog from 'posthog-js'

const isBrowser = () => typeof window !== 'undefined'

export const trackEvent = (eventName, properties = {}) => {
  try {
    if (!isBrowser()) return
    if (!posthog || !posthog.__loaded) return
    posthog.capture(eventName, properties)
  } catch (_) { /* swallow */ }
}

export const identifyUser = (userId, email, extras = {}) => {
  try {
    if (!isBrowser() || !userId) return
    if (!posthog || !posthog.__loaded) return
    posthog.identify(String(userId), { email, ...extras })
  } catch (_) { /* swallow */ }
}

export const resetAnalytics = () => {
  try {
    if (!isBrowser()) return
    if (!posthog || !posthog.__loaded) return
    posthog.reset()
  } catch (_) { /* swallow */ }
}

// Convenience wrappers for our standard funnel events
export const track = {
  signup:                (props = {}) => trackEvent('signup_completed', props),
  login:                 (props = {}) => trackEvent('login_completed', props),
  quizStarted:           (props = {}) => trackEvent('quiz_started', props),
  quizStepCompleted:     (step, props = {}) => trackEvent('quiz_step_completed', { step, ...props }),
  quizCompleted:         (props = {}) => trackEvent('quiz_completed', props),
  paywallView:           (props = {}) => trackEvent('paywall_view', props),
  checkoutInitiated:     (props = {}) => trackEvent('checkout_initiated', props),
  founderReservation:    (props = {}) => trackEvent('founder_reservation_submitted', props),
  advisorMessage:        (props = {}) => trackEvent('advisor_message_sent', props),
  exitIntentCaptured:    (props = {}) => trackEvent('exit_intent_captured', props),
  scholarshipSaved:      (props = {}) => trackEvent('scholarship_saved', props),
  scholarshipView:       (props = {}) => trackEvent('scholarship_viewed', props),
  databaseBlurHit:       (props = {}) => trackEvent('database_blur_hit', props),
  rejectionDebuggerUsed: (props = {}) => trackEvent('rejection_debugger_used', props),
  simulatorUsed:         (props = {}) => trackEvent('simulator_used', props),
}
