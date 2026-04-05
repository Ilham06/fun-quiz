'use client'
import { useState } from 'react'

export default function ShuffleSettings({ sessionId, initialShuffleQuestions, initialShuffleOptions }) {
  const [shuffleQ, setShuffleQ] = useState(initialShuffleQuestions)
  const [shuffleO, setShuffleO] = useState(initialShuffleOptions)
  const [saving, setSaving] = useState(false)

  async function toggle(field, current, setter) {
    setSaving(true)
    const res = await fetch(`/api/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !current }),
    })
    if (res.ok) setter(!current)
    setSaving(false)
  }

  return (
    <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
          <span className="text-base">🔀</span>
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Konfigurasi</h3>
          <p className="text-[11px] text-gray-500">Acak urutan soal & jawaban per mahasiswa</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Shuffle Questions */}
        <button
          type="button"
          onClick={() => toggle('shuffle_questions', shuffleQ, setShuffleQ)}
          disabled={saving}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 hover:border-amber-200 transition-all disabled:opacity-50"
        >
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-800">Acak Urutan Soal</p>
            <p className="text-[11px] text-gray-400">Setiap mahasiswa mendapat urutan soal berbeda</p>
          </div>
          <div className={`w-10 h-[22px] rounded-full relative transition-colors duration-200 shrink-0 ${
            shuffleQ ? 'bg-amber-500' : 'bg-gray-200'
          }`}>
            <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${
              shuffleQ ? 'left-[22px]' : 'left-[3px]'
            }`} />
          </div>
        </button>

        {/* Shuffle Options */}
        <button
          type="button"
          onClick={() => toggle('shuffle_options', shuffleO, setShuffleO)}
          disabled={saving}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 hover:border-amber-200 transition-all disabled:opacity-50"
        >
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-800">Acak Pilihan Jawaban</p>
            <p className="text-[11px] text-gray-400">Opsi A/B/C/D diacak untuk pilihan ganda</p>
          </div>
          <div className={`w-10 h-[22px] rounded-full relative transition-colors duration-200 shrink-0 ${
            shuffleO ? 'bg-amber-500' : 'bg-gray-200'
          }`}>
            <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${
              shuffleO ? 'left-[22px]' : 'left-[3px]'
            }`} />
          </div>
        </button>
      </div>
    </div>
  )
}
