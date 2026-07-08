'use client'
import { useState } from 'react'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Mail, MessageCircle } from 'lucide-react'

function Contact() {
  const [form, setForm] = useState({ name:'', email:'', message:'' })
  const send = () => {
    if (!form.email || !form.message) return toast.error('Please fill in email and message')
    toast.success('Message received', { description: 'We’ll get back within a few business days.' })
    setForm({ name:'', email:'', message:'' })
  }
  return (
    <div className="dark-bg min-h-screen">
      <Navbar />
      <div className="container mx-auto max-w-4xl px-4 py-14">
        <Badge variant="outline" className="border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#F5D67B]">Contact</Badge>
        <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-white">Talk to the ScholarshipFit team</h1>
        <p className="mt-2 text-white/60 max-w-2xl">Report a broken source link, correct a record, share an outcome, or say hello. We read every message.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card className="border-white/10 bg-white/[0.03]"><CardContent className="p-5 space-y-3">
            <Input placeholder="Your name" value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))} className="bg-white/[0.04] border-white/10 text-white"/>
            <Input placeholder="Email" type="email" value={form.email} onChange={e=>setForm(f=>({...f, email:e.target.value}))} className="bg-white/[0.04] border-white/10 text-white"/>
            <textarea placeholder="Your message..." rows={6} value={form.message} onChange={e=>setForm(f=>({...f, message:e.target.value}))} className="w-full rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"/>
            <Button onClick={send} className="btn-gold btn-pill font-medium">Send message</Button>
          </CardContent></Card>
          <div className="space-y-4">
            <Card className="border-white/10 bg-white/[0.03]"><CardContent className="p-5 flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-[#D4AF37]/100/15 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center"><Mail className="h-4 w-4"/></div>
              <div><p className="text-white font-medium">Email</p><p className="text-sm text-white/60">hello@scholarshipfit.app</p></div>
            </CardContent></Card>
            <Card className="border-white/10 bg-white/[0.03]"><CardContent className="p-5 flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-[#D4AF37]/100/15 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center"><MessageCircle className="h-4 w-4"/></div>
              <div><p className="text-white font-medium">Ask Nova</p><p className="text-sm text-white/60">Our AI advisor answers scholarship questions 24/7.</p></div>
            </CardContent></Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Contact
