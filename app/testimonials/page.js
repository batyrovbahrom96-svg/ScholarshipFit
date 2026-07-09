import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import RealTestimonials from '@/components/site/RealTestimonials'

export const metadata = {
  title: 'Scholarship Winners — ScholarshipFit',
  description: 'Meet the real scholarship winners who used ScholarshipFit — verified on-camera stories from Uzbekistan to Qatar, Canada, France, and the United States.',
}

export default function TestimonialsPage() {
  return (
    <div className="min-h-dvh bg-black text-white">
      <Navbar />
      <RealTestimonials />
      <Footer />
    </div>
  )
}
