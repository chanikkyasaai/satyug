import { useState, useRef, useEffect } from 'react'
import { AssistantAPI } from '../api/endpoints'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatWidget({ userId, role }: { userId: number; role: 'student' | 'admin' }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'assistant',
    content: 'Hi! Ask me about courses, classrooms, or your timetable.'
  }])
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  async function send() {
    const text = input.trim()
    if (!text) return
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')
    setSending(true)
    try {
      console.log(text, userId, role);
      
      const res = await AssistantAPI.chat(text, userId, role)
      const reply = (res as any)?.final_answer || (res as any)?.reply || (res as any)?.message || JSON.stringify(res)
      setMessages((prev) => [...prev, { role: 'assistant', content: String(reply) }])
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: 'assistant', content: e?.message || 'Error from assistant' }])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg flex items-center justify-center"
          aria-label="Open chat"
        >
          💬
        </button>
      )}
      {open && (
        <div className="w-80 h-[28rem] bg-white rounded-2xl shadow-2xl border flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
            <div className="font-semibold">Assistant</div>
            <button onClick={() => setOpen(false)} className="text-white/90 hover:text-white">✕</button>
          </div>
          <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-gray-50">
            {messages.map((m, idx) => (
              <div key={idx} className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${m.role === 'user' ? 'ml-auto bg-blue-600 text-white' : 'mr-auto bg-white border'}`}>
                {m.content}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="p-2 border-t flex items-center gap-2">
            <input
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              disabled={sending}
            />
            <button onClick={send} disabled={sending} className="px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50">Send</button>
          </div>
        </div>
      )}
    </div>
  )
}


