import ShareYourStoryClient from './client'

export const metadata = {
  title: 'Share your scholarship story — ScholarshipFit',
  description: 'Won a scholarship using ScholarshipFit? Tell us your story and we’ll feature it on our testimonials wall — with your LinkedIn profile linked for verification.',
  alternates: { canonical: 'https://scholarshipfit.com/share-your-story' },
  openGraph: { type: 'website', title: 'Share your scholarship story', description: 'Feature your win on ScholarshipFit’s verified testimonials wall.' },
}

export default function Page() { return <ShareYourStoryClient/> }
