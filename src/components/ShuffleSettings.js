'use client'
import { useState } from 'react'

function Toggle({ enabled }) {
  return (
    <div className={`w-10 h-[22px] rounded-full relative transition-colors duration-200 shrink-0 ${
      enabled ? 'bg-amber-500' : 'bg-gray-200'
    }`}>
      <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${
        enabled ? 'left-[22px]' : 'left-[3px]'
      }`} />
    </div>
  )
}

export default function ShuffleSettings({ sessionId, initialShuffleQuestions, initialShuffleOptions, initialQuizMode, initialDetectTabSwitch, initialDetectWindowBlur, initialDetectDevtools, initialDetectPageLeave, initialDetectPaste }) {
  const [shuffleQ, setShuffleQ] = useState(initialShuffleQuestions)
  const [shuffleO, setShuffleO] = useState(initialShuffleOptions)
  const [quizMode, setQuizMode] = useState(initialQuizMode || 'one_by_one')
  const [detectTab, setDetectTab] = useState(initialDetectTabSwitch !== false)
  const [detectBlur, setDetectBlur] = useState(initialDetectWindowBlur === true)
  const [detectDevtools, setDetectDevtools] = useState(initialDetectDevtools === true)
  const [detectPageLeave, setDetectPageLeave] = useState(initialDetectPageLeave === true)
  const [detectPaste, setDetectPaste] = useState(initialDetectPaste === true)
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

  async function setMode(mode) {
    if (mode === quizMode) return
    setSaving(true)
    const res = await fetch(`/api/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quiz_mode: mode }),
    })
    if (res.ok) setQuizMode(mode)
    setSaving(false)
  }

  return (
    <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
          <span className="text-base">⚙️</span>
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Konfigurasi Quiz</h3>
          <p className="text-[11px] text-gray-500">Atur mode pengerjaan, acak soal & jawaban</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Mode Pengerjaan</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode('one_by_one')}
              disabled={saving}
              className={`relative px-4 py-3.5 rounded-xl border-2 transition-all disabled:opacity-50 text-left ${
                quizMode === 'one_by_one'
                  ? 'border-amber-500 bg-amber-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-amber-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-lg">📱</span>
                <p className="text-sm font-bold text-gray-800">Satu per Satu</p>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Soal muncul satu per satu, tidak bisa kembali ke soal sebelumnya
              </p>
              {quizMode === 'one_by_one' && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                  </svg>
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMode('all_at_once')}
              disabled={saving}
              className={`relative px-4 py-3.5 rounded-xl border-2 transition-all disabled:opacity-50 text-left ${
                quizMode === 'all_at_once'
                  ? 'border-amber-500 bg-amber-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-amber-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-lg">📄</span>
                <p className="text-sm font-bold text-gray-800">Semua Sekaligus</p>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Semua soal tampil, bisa scroll & ubah jawaban seperti kertas
              </p>
              {quizMode === 'all_at_once' && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                  </svg>
                </div>
              )}
            </button>
          </div>
        </div>

        <div className="border-t border-amber-200/40 pt-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Pengacakan</p>
          <div className="space-y-2">
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
              <Toggle enabled={shuffleQ} />
            </button>

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
              <Toggle enabled={shuffleO} />
            </button>
          </div>
        </div>

        <div className="border-t border-amber-200/40 pt-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Deteksi Kecurangan</p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => toggle('detect_tab_switch', detectTab, setDetectTab)}
              disabled={saving}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 hover:border-amber-200 transition-all disabled:opacity-50"
            >
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800">Deteksi Pindah Tab</p>
                <p className="text-[11px] text-gray-400">Catat saat mahasiswa pindah tab atau minimize browser</p>
              </div>
              <Toggle enabled={detectTab} />
            </button>

            <button
              type="button"
              onClick={() => toggle('detect_window_blur', detectBlur, setDetectBlur)}
              disabled={saving}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 hover:border-amber-200 transition-all disabled:opacity-50"
            >
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800">Deteksi Pindah Aplikasi</p>
                <p className="text-[11px] text-gray-400">Catat saat mahasiswa klik ke luar jendela browser</p>
              </div>
              <Toggle enabled={detectBlur} />
            </button>

            <button
              type="button"
              onClick={() => toggle('detect_devtools', detectDevtools, setDetectDevtools)}
              disabled={saving}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 hover:border-amber-200 transition-all disabled:opacity-50"
            >
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800">Deteksi Buka DevTools</p>
                <p className="text-[11px] text-gray-400">Catat saat mahasiswa membuka Developer Tools (F12)</p>
              </div>
              <Toggle enabled={detectDevtools} />
            </button>

            <button
              type="button"
              onClick={() => toggle('detect_page_leave', detectPageLeave, setDetectPageLeave)}
              disabled={saving}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 hover:border-amber-200 transition-all disabled:opacity-50"
            >
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800">Deteksi Refresh / Tutup Halaman</p>
                <p className="text-[11px] text-gray-400">Catat saat mahasiswa refresh atau menutup halaman quiz</p>
              </div>
              <Toggle enabled={detectPageLeave} />
            </button>

            <button
              type="button"
              onClick={() => toggle('detect_paste', detectPaste, setDetectPaste)}
              disabled={saving}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 hover:border-amber-200 transition-all disabled:opacity-50"
            >
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800">Deteksi Copy-Paste</p>
                <p className="text-[11px] text-gray-400">Catat saat mahasiswa paste teks dari luar ke jawaban</p>
              </div>
              <Toggle enabled={detectPaste} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
