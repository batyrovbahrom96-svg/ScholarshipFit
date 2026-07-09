import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import StudentStories from '@/components/site/StudentStories'

export const metadata = {
  title: 'Student Stories — ScholarshipFit',
  description: 'Real stories from students who used ScholarshipFit during their scholarship research process and later reported scholarship offers. Outcomes reflect individual user experiences.',
}

export default function TestimonialsPage() {
  return (
    <div className="min-h-dvh bg-black text-white">
      <Navbar />
      <StudentStories />
      <Footer />
    </div>
  )
}
