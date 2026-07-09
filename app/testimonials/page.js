import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import Testimonials from '@/components/site/Testimonials'

export const metadata = {
  title: 'Testimonials — ScholarshipFit',
  description: 'What our beta cohort of international students is saying about ScholarshipFit\u2019s AI-powered scholarship matching and Readiness Score.',
}

export default function TestimonialsPage() {
  return (
    <div className="min-h-dvh bg-black text-white">
      <Navbar />
      <Testimonials />
      <Footer />
    </div>
  )
}
