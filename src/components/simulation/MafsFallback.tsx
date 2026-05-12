"use client"

import { Mafs, Coordinates, Circle, Vector } from "mafs"
import { useState, useEffect } from "react"
import "mafs/core.css"
import "mafs/font.css"

export default function MafsFallback() {
  const [time, setTime] = useState(0)

  useEffect(() => {
    let frame = requestAnimationFrame(function loop(t) {
      setTime(t / 1000)
      frame = requestAnimationFrame(loop)
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  const radius = 3
  const orbitalPeriod = 10
  const angle = (time / orbitalPeriod) * Math.PI * 2

  const x = radius * Math.cos(angle)
  const y = radius * Math.sin(angle)

  return (
    <div className="w-full h-full bg-[#050505] flex items-center justify-center p-8">
      <div className="w-full h-full max-w-4xl aspect-square border border-white/5 rounded-3xl overflow-hidden relative shadow-[0_0_100px_rgba(0,255,255,0.05)]">
        <Mafs pan={false} zoom={false}>
          <Coordinates.Cartesian />
          
          <Circle 
            center={[0, 0]} 
            radius={1.5} 
            color="#1a2b4c"
          />
          
          <Circle 
            center={[0, 0]} 
            radius={radius} 
            color="#ffffff" 
            weight={1}
          />
          
          <Circle 
            center={[x, y]} 
            radius={0.15} 
            color="#00ffff"
          />
          
          <Vector
            tail={[x, y]}
            tip={[x - Math.sin(angle), y + Math.cos(angle)]}
            color="#00ffff"
            weight={2}
          />
        </Mafs>
        
        <div className="absolute top-8 left-8">
          <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest bg-black/80 px-3 py-1 rounded-full border border-cyan-500/20">
            2D FALLBACK ACTIVE: LOW PERFORMANCE MODE
          </div>
        </div>
      </div>
    </div>
  )
}
