'use client'
import Link from 'next/link'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Star, Rocket } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const PLANS = [
  { name:'Free Research Check', price:'$0', pill:'Free', highlight:false, features:['Basic profile match preview','Top 3 source-linked matches','Community disclaimer coverage','View sample report'] },
  { name:'Starter Report', price:'—', pill:'Coming soon', highlight:false, features:['Full AI report (up to 15 matches)','Requirements met / missing lists','Downloadable summary','Email digest of updates'] },
  { name:'Full Scholarship Cabinet', price:'—', pill:'Popular', highlight:true, features:['Personal dashboard','Application tracker','Document checklist','Deadline radar','Multiple AI reruns'] },
  { name:'AI Advisor Access', price:'—', pill:'Coming soon', highlight:false, features:['Nova — unlimited chat','Multi-session memory','Priority updates','Cabinet integration'] },
]

function Pricing() {
  const [email, setEmail] = useState('')
  const joinWaitlist = () => {
    if (!email) return toast.error('Enter your email')
    toast.success('You are on the waitlist', { description: 'We’ll email you when payments open.' })
    setEmail('')
  }
  return (
    <div className="cosmos-bg min-h-screen">
      <Navbar />
      <div className="container mx-auto max-w-6xl px-4 py-14">
        <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-200">Pricing</Badge>
        <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-white">Simple SaaS plans, launching soon</h1>
        <p className="mt-2 text-slate-400 max-w-2xl">Payments are not active yet. Join the waitlist to get early access and founder pricing.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {PLANS.map((p,i)=>(
            <Card key={i} className={`relative border-white/10 ${p.highlight ? 'bg-gradient-to-b from-cyan-500/10 to-white/[0.02] border-cyan-400/30' : 'bg-white/[0.03]'}`}>
              {p.highlight && <div className="absolute -top-2 left-1/2 -translate-x-1/2"><Badge className="bg-cyan-500 text-black hover:bg-cyan-400"><Star className="mr-1 h-3 w-3"/>{p.pill}</Badge></div>}
              <CardContent className="p-5">
                <p className="text-sm text-slate-400">{p.name}</p>
                <p className="mt-1 text-3xl font-semibold text-white">{p.price}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-300">
                  {p.features.map((f,j)=>(<li key={j} className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-400 mt-0.5"/><span>{f}</span></li>))}
                </ul>
                <div className="mt-4">
                  {p.name === 'Free Research Check'
                    ? <Link href="/onboarding"><Button className="w-full bg-orange-500 hover:bg-orange-400 text-white"><Rocket className="mr-2 h-4 w-4"/>Start free</Button></Link>
                    : <Button variant="outline" className="w-full border-white/10 bg-transparent text-slate-100 hover:bg-white/5" disabled>Join waitlist</Button>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-10 border-white/10 bg-white/[0.03]">
          <CardContent className="p-6 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div>
              <p className="text-lg font-semibold text-white">Payments are not active yet</p>
              <p className="text-sm text-slate-400">Enter your email to be notified when we open paid plans.</p>
            </div>
            <div className="flex gap-2">
              <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"/>
              <Button onClick={joinWaitlist} className="bg-cyan-500 text-black hover:bg-cyan-400">Join waitlist</Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  )
}

export default Pricing
