'use client'
import { useMemo, useState, useRef, useCallback } from 'react'

const PALETTES = [
  { bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.25)', text: '#d8b4fe' },
  { bg: 'rgba(236,72,153,0.15)', border: 'rgba(236,72,153,0.25)', text: '#f9a8d4' },
  { bg: 'rgba(34,211,238,0.15)', border: 'rgba(34,211,238,0.25)', text: '#a5f3fc' },
  { bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.25)', text: '#fde68a' },
  { bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.25)', text: '#a7f3d0' },
  { bg: 'rgba(129,140,248,0.15)', border: 'rgba(129,140,248,0.25)', text: '#c7d2fe' },
  { bg: 'rgba(251,113,133,0.15)', border: 'rgba(251,113,133,0.25)', text: '#fecdd3' },
  { bg: 'rgba(56,189,248,0.15)', border: 'rgba(56,189,248,0.25)', text: '#bae6fd' },
  { bg: 'rgba(163,230,53,0.15)', border: 'rgba(163,230,53,0.25)', text: '#d9f99d' },
  { bg: 'rgba(232,121,249,0.15)', border: 'rgba(232,121,249,0.25)', text: '#f0abfc' },
]

const SHAPES = [
  '28px 42px 28px 42px',
  '42px 28px 42px 28px',
  '36px 20px 36px 20px',
  '20px 36px 20px 36px',
  '32px 32px 32px 32px',
  '40px 24px 40px 24px',
  '24px 40px 24px 40px',
  '48px 16px 48px 16px',
]

function seeded(seed) {
  let x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

export default function AnswerCloud({ answers }) {
  const [positions, setPositions] = useState({})
  const [scales, setScales] = useState({})
  const [topZ, setTopZ] = useState(1)
  const [zMap, setZMap] = useState({})
  const dragRef = useRef(null)
  const containerRef = useRef(null)

  const bubbles = useMemo(() => {
    return answers.map((a, i) => {
      const s = (a.id?.charCodeAt(0) || 0) * 131 + (a.id?.charCodeAt(2) || 0) * 17 + i
      const r = (n) => seeded(s + n)
      return {
        ...a,
        palette: PALETTES[i % PALETTES.length],
        shape: SHAPES[Math.floor(r(0) * SHAPES.length)],
        rotation: (r(1) - 0.5) * 10,
        baseScale: 0.88 + r(2) * 0.24,
        initX: (r(3) - 0.5) * 30,
        initY: (r(4) - 0.5) * 16,
        floatDuration: 3 + r(5) * 4,
        floatDelay: r(6) * -6,
        enterDelay: Math.min(i * 70, 1800),
      }
    })
  }, [answers])

  const handlePointerDown = useCallback((e, id) => {
    e.preventDefault()
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)

    const startX = e.clientX
    const startY = e.clientY
    const pos = positions[id] || { x: 0, y: 0 }

    const newZ = topZ + 1
    setTopZ(newZ)
    setZMap((prev) => ({ ...prev, [id]: newZ }))

    dragRef.current = { id, startX, startY, origX: pos.x, origY: pos.y, moved: false }
  }, [positions, topZ])

  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current) return
    const d = dragRef.current
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true

    setPositions((prev) => ({
      ...prev,
      [d.id]: { x: d.origX + dx, y: d.origY + dy },
    }))
  }, [])

  const handlePointerUp = useCallback((e) => {
    if (!dragRef.current) return
    const d = dragRef.current

    if (!d.moved) {
      setScales((prev) => {
        const cur = prev[d.id] || 1
        const next = cur >= 1.8 ? 1 : cur + 0.4
        return { ...prev, [d.id]: next }
      })
    }

    dragRef.current = null
  }, [])

  if (bubbles.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
          <span className="text-3xl">💬</span>
        </div>
        <p className="text-white/25 text-sm">Belum ada jawaban</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="text-center py-1 shrink-0">
        <span className="text-white/20 text-[10px]">Drag untuk pindahkan · Klik untuk perbesar</span>
      </div>

      <div
        ref={containerRef}
        className="flex-1 min-h-0 flex flex-wrap items-center justify-center gap-0 p-4 content-center relative overflow-hidden"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ touchAction: 'none' }}
      >
        {bubbles.map((b) => {
          const pos = positions[b.id] || { x: 0, y: 0 }
          const userScale = scales[b.id] || 1
          const z = zMap[b.id] || 0
          const isDragging = dragRef.current?.id === b.id
          const totalX = b.initX + pos.x
          const totalY = b.initY + pos.y
          const totalScale = b.baseScale * userScale

          return (
            <div
              key={b.id}
              onPointerDown={(e) => handlePointerDown(e, b.id)}
              className={`select-none ${isDragging ? '' : 'transition-all duration-300'}`}
              style={{
                transform: `rotate(${b.rotation}deg) scale(${totalScale}) translate(${totalX}px, ${totalY}px)`,
                zIndex: z,
                margin: '6px 4px',
                cursor: isDragging ? 'grabbing' : 'grab',
                animationDelay: `${b.enterDelay}ms`,
                animationName: 'cloudFadeIn',
                animationDuration: '600ms',
                animationFillMode: 'backwards',
                animationTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <div
                className="relative px-4 py-3 max-w-[280px] backdrop-blur-sm border"
                style={{
                  background: b.palette.bg,
                  borderColor: b.palette.border,
                  borderRadius: b.shape,
                  animation: isDragging ? 'none' : `bubbleFloat ${b.floatDuration}s ease-in-out ${b.floatDelay}s infinite`,
                }}
              >
                <p className="font-semibold text-sm leading-snug pointer-events-none" style={{ color: b.palette.text }}>
                  {b.content}
                </p>
                <div className="flex items-center justify-between mt-1.5 gap-2 pointer-events-none">
                  <span className="text-white/20 text-[10px] truncate">
                    {b.student_name || 'Anonim'}
                  </span>
                  {(b.upvotes || 0) > 0 && (
                    <span className="text-rose-400/50 text-[10px] shrink-0">❤️ {b.upvotes}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-center gap-4 py-1.5 shrink-0">
        <span className="text-white/15 text-[10px] font-medium">{answers.length} jawaban</span>
        <button
          onClick={() => { setPositions({}); setScales({}); setZMap({}); setTopZ(1) }}
          className="text-white/15 text-[10px] font-medium hover:text-white/30 transition-colors"
        >
          Reset posisi
        </button>
      </div>
    </div>
  )
}
