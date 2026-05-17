"use client"

import dynamic from 'next/dynamic'
import { useState, useEffect, useRef } from 'react'
import { Settings, Send, Sparkles, AlertCircle, Cpu } from 'lucide-react'
import { callSocraticAI, Message } from '@/lib/ai'
import { useSharedState } from '@/hooks/useSharedState'
import { sharedState } from '@/lib/yjs'

const OrbitalSimulation = dynamic(() => import('@/components/simulation/OrbitalSimulation'), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-black text-cyan-500 font-mono text-xs tracking-widest uppercase animate-pulse">Initializing Celestial Engine...</div>
})

const MafsFallback = dynamic(() => import('@/components/simulation/MafsFallback'), { 
  ssr: false 
})

export default function Home() {
  const [showSettings, setShowSettings] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useFallback, setUseFallback] = useState(false)
  
  const [telemetry] = useSharedState('telemetry', { velocity: "0.00", altitude: "0.00", eccentricity: "0.0000" })
  
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const savedKey = localStorage.getItem('NVIDEA_API_KEY')
    if (savedKey) setApiKey(savedKey)
    
    // WebGL support check
    try {
        const canvas = document.createElement('canvas')
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
        if (!gl) setUseFallback(true)
    } catch (_e) {
        setUseFallback(true)
    }

    setMessages([
      { 
        role: 'assistant', 
        content: "Welcome to Axiom-Sovereign. I am your guide through the celestial mechanics of our universe. Observe the satellite in stable orbit. What do you think keeps it from falling into the Earth, or flying off into the void?" 
      }
    ])
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSaveSettings = () => {
    localStorage.setItem('NVIDEA_API_KEY', apiKey)
    setShowSettings(false)
    setError(null)
  }

  const parseAICommands = (content: string) => {
    const jsonRegex = /```json\n([\s\S]*?)\n```/
    const match = content.match(jsonRegex)
    if (match && match[1]) {
      try {
        const command = JSON.parse(match[1])
        sharedState.set('command', command)
        return content.replace(jsonRegex, '').trim()
      } catch (e) {
        console.error("Failed to parse AI command", e)
      }
    }
    return content
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return
    if (!apiKey) {
      setError("Please provide an NVIDIA API Key in settings.")
      setShowSettings(true)
      return
    }

    const userMessage: Message = { role: 'user', content: input }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const contextMessage: Message = {
        role: 'system',
        content: `TELEMETRY: Velocity ${telemetry.velocity} KM/S, Alt ${telemetry.altitude} KM. Mode: 3D Engine. Commands available.`
      }
      const response = await callSocraticAI([contextMessage, ...newMessages], apiKey)
      const cleanContent = parseAICommands(response)
      setMessages([...newMessages, { role: 'assistant', content: cleanContent }])
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred with the AI tutor."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="relative w-screen h-screen flex flex-col items-center justify-center bg-black overflow-hidden font-sans text-white">
      <div className="absolute inset-0 z-0">
        {useFallback ? <MafsFallback /> : <OrbitalSimulation />}
      </div>

      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 z-10">
        <header className="flex justify-between items-start pointer-events-auto">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter text-white uppercase italic drop-shadow-2xl">Axiom-Sovereign</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              <p className="text-cyan-400 font-mono text-xs tracking-widest uppercase">Orbital Mechanics V1.0</p>
            </div>
          </div>
          <div className="flex gap-4">
              <button 
                onClick={() => setUseFallback(!useFallback)}
                className={`p-3 border rounded-full transition-all backdrop-blur-md active:scale-95 ${useFallback ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}
              >
                <Cpu className="w-6 h-6" />
              </button>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all backdrop-blur-md active:scale-95"
              >
                <Settings className="w-6 h-6 text-white/70" />
              </button>
          </div>
        </header>

        <div className="w-full max-w-xl pointer-events-auto self-start">
           <div className="bg-black/60 border border-white/10 backdrop-blur-3xl rounded-2xl p-6 shadow-2xl relative overflow-hidden">
             {error && (
               <div className="absolute inset-x-0 top-0 bg-red-500/20 border-b border-red-500/50 p-2 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300">
                 <AlertCircle className="w-4 h-4 text-red-400" />
                 <span className="text-[10px] font-mono text-red-400 uppercase truncate px-4">{error}</span>
               </div>
             )}
             
             <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-4 mt-4">
               <Sparkles className="w-4 h-4 text-cyan-400" />
               <span className="text-[10px] font-mono tracking-[0.3em] text-white/40 uppercase">Socratic Intelligence</span>
             </div>
             
             <div ref={scrollRef} className="space-y-6 h-80 overflow-y-auto mb-6 pr-2 scrollbar-hide">
                {messages.map((m, i) => (
                  <div key={i} className={`${m.role === 'user' ? 'ml-8 text-right' : 'mr-8 text-left'}`}>
                    <div className={`inline-block px-1 py-1 text-sm leading-relaxed ${m.role === 'assistant' ? 'italic font-serif text-lg text-white/90' : 'font-mono text-cyan-400 text-xs uppercase tracking-wider'}`}>
                      {m.role === 'user' ? `> ${m.content}` : m.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
             </div>

             <div className="flex gap-2 bg-white/5 border border-white/10 rounded-xl p-1 pr-2 focus-within:border-cyan-500/50 transition-all">
               <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Formulate a hypothesis..."
                className="flex-1 bg-transparent border-none px-4 py-3 text-sm focus:outline-none placeholder:text-white/20"
               />
               <button onClick={handleSendMessage} disabled={isLoading} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-all active:scale-95 disabled:opacity-30">
                 <Send className="w-5 h-5" />
               </button>
             </div>
           </div>
        </div>
        
        <footer className="w-full flex justify-between items-end pointer-events-auto">
          <div className="flex gap-12 text-[10px] font-mono tracking-[0.2em] text-white/30 uppercase">
            <div>
              <p className="text-cyan-400/40 mb-1">Velocity</p>
              <p className="text-xl text-white/80 font-light">{telemetry.velocity} <span className="text-xs opacity-30">KM/S</span></p>
            </div>
            <div>
              <p className="text-cyan-400/40 mb-1">Altitude</p>
              <p className="text-xl text-white/80 font-light">{telemetry.altitude} <span className="text-xs opacity-30">KM</span></p>
            </div>
            <div>
              <p className="text-cyan-400/40 mb-1">Eccentricity</p>
              <p className="text-xl text-white/80 font-light">{telemetry.eccentricity}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-[9px] font-mono text-white/10 uppercase tracking-[0.3em]">
            <span>Deterministic Physics Engine (Rapier)</span>
            <div className="w-1 h-1 bg-white/10 rounded-full" />
            <span>NVIDIA NIM Reasoning</span>
            <div className="w-1 h-1 bg-white/10 rounded-full" />
            <span>CRDT State Sync (Yjs)</span>
          </div>
        </footer>
      </div>

      {showSettings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 pointer-events-auto animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-10 shadow-2xl">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-4 text-white">
              <div className="p-3 bg-cyan-500/10 rounded-2xl"><Settings className="w-6 h-6 text-cyan-400" /></div>
              Sovereign Settings
            </h2>
            <p className="text-xs text-white/40 mb-8 font-mono tracking-widest uppercase">Environment Configuration</p>
            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-mono text-white/40 uppercase tracking-widest mb-3">NVIDIA API Key</label>
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="nvapi-..."
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-sm font-mono focus:border-cyan-500/50 transition-all text-white"
                />
                <p className="mt-2 text-[9px] text-white/20 italic">Must start with 'nvapi-'. Key is stored locally in your browser.</p>
              </div>
              <button onClick={handleSaveSettings} className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-cyan-400 uppercase tracking-widest text-xs active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
