'use client'
import { useEffect, useRef, useState } from 'react'
import Navbar from '@/components/site/Navbar'
import Footer from '@/components/site/Footer'
import Starfield from '@/components/site/Starfield'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { store } from '@/lib/client-store'
import { Send, Sparkles, Info, ShieldCheck } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

const STARTERS = [
  'I want full funding in Germany for engineering with IELTS 7.0 and GPA 3.7.',
  'What scholarships fit a Master in Computer Science for a Nigerian student, budget $2000/yr?',
  'Compare Stipendium Hungaricum vs Türkiye Scholarships for a Bachelor in Economics.',
  'Which of these have the lowest application waste risk for a first-time applicant?',
]

function Md({ text }) {
  // Very light Markdown: **bold**, [link](url), lists, newlines
  const html = (text || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,'<a target="_blank" rel="noopener noreferrer" class="text-cyan-300 underline underline-offset-2 hover:text-cyan-200" href="$2">$1</a>')
    .replace(/(^|\n)-\s(.+)/g,'$1<li>$2</li>')
    .replace(/\n\n/g,'<br/><br/>')
    .replace(/\n/g,'<br/>')
  return <div className="prose prose-invert max-w-none text-slate-100 [&_li]:list-disc [&_li]:ml-5 leading-relaxed" dangerouslySetInnerHTML={{__html: html}} />
}

function Advisor() {
  const [sessionId, setSessionId] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    let s = store.getAdvisorSession()
    if (!s) { s = uuidv4(); store.setAdvisorSession(s) }
    setSessionId(s)
    fetch(`/api/advisor/history?session_id=${s}`).then(r=>r.json()).then(d => {
      if (d.messages?.length) setMessages(d.messages)
    })
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  const send = async (text) => {
    const msg = (text ?? input).trim()
    if (!msg || busy) return
    setInput('')
    setMessages(m => [...m, { role:'user', content: msg, id: 'tmp-'+Date.now() }])
    setBusy(true)
    try {
      const res = await fetch('/api/advisor', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ session_id: sessionId, message: msg })
      }).then(r=>r.json())
      if (res.reply) setMessages(m => [...m, { role:'assistant', content: res.reply, id:'a-'+Date.now() }])
      else setMessages(m => [...m, { role:'assistant', content: '_Sorry, I could not respond right now. Please try again._', id:'e-'+Date.now() }])
    } catch (e) {
      setMessages(m => [...m, { role:'assistant', content: '_Network error._ '+String(e.message), id:'e-'+Date.now() }])
    } finally { setBusy(false) }
  }

  return (
    <div className="cosmos-bg min-h-screen">
      <Navbar />
      <div className="relative">
        <div className="absolute inset-0 -z-0"><Starfield density={100}/></div>
        <div className="container mx-auto max-w-4xl px-4 py-10 relative">
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-200"><Sparkles className="mr-1 h-3 w-3"/>Nova · Claude Sonnet 4.5</Badge>
              <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-white">AI Scholarship Advisor</h1>
              <p className="mt-1 text-slate-400">Ask in plain language. Nova only references scholarships from our source-linked database.</p>
            </div>
          </div>

          <Card className="mt-6 border-white/10 bg-white/[0.03]">
            <CardContent className="p-0">
              <div ref={scrollRef} className="max-h-[60vh] min-h-[380px] overflow-y-auto p-5 space-y-4">
                {messages.length === 0 && (
                  <div>
                    <p className="text-sm text-slate-400">Start with an example:</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {STARTERS.map((s,i)=>(
                        <button key={i} onClick={()=>send(s)} className="text-left rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 hover:border-cyan-400/30 hover:bg-cyan-500/5">{s}</button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role==='user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${m.role==='user' ? 'bg-cyan-500 text-black' : 'bg-white/[0.05] border border-white/10 text-slate-100'}`}>
                      {m.role==='assistant' && <p className="mb-1 text-[11px] uppercase tracking-widest text-cyan-300">Nova</p>}
                      {m.role==='user' ? <p>{m.content}</p> : <Md text={m.content}/>}
                    </div>
                  </div>
                ))}
                {busy && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl px-4 py-3 text-sm bg-white/[0.05] border border-white/10 text-slate-100">
                      <p className="mb-1 text-[11px] uppercase tracking-widest text-cyan-300">Nova</p>
                      <span className="inline-flex gap-1">
                        <span className="h-2 w-2 rounded-full bg-cyan-300 animate-bounce"/>
                        <span className="h-2 w-2 rounded-full bg-cyan-300 animate-bounce" style={{animationDelay:'0.1s'}}/>
                        <span className="h-2 w-2 rounded-full bg-cyan-300 animate-bounce" style={{animationDelay:'0.2s'}}/>
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <form onSubmit={e=>{e.preventDefault(); send()}} className="border-t border-white/5 p-3 flex gap-2">
                <Input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask Nova anything about scholarships..." className="bg-white/[0.04] border-white/10 text-slate-100 placeholder:text-slate-500"/>
                <Button type="submit" disabled={busy || !input.trim()} className="bg-cyan-500 text-black hover:bg-cyan-400"><Send className="h-4 w-4"/></Button>
              </form>
            </CardContent>
          </Card>

          <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-500"><Info className="mt-0.5 h-3 w-3"/>ScholarshipFit provides informational scholarship research only. It does not guarantee admission, scholarships, visas, or funding. Users apply directly through official provider websites.</p>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Advisor
