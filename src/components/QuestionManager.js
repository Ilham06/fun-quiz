'use client'
import { useState, useRef } from 'react'
import { read, utils } from 'xlsx'

export default function QuestionManager({ sessionId, initialQuestions = [], sessionType = 'quiz' }) {
  const isExam = sessionType === 'exam'
  const [questions, setQuestions] = useState(initialQuestions)
  const [showForm, setShowForm] = useState(false)
  const [newText, setNewText] = useState('')
  const [newType, setNewType] = useState('open')
  const [newOptions, setNewOptions] = useState(['', ''])
  const [newCorrectAnswer, setNewCorrectAnswer] = useState(null)
  const [newTimer, setNewTimer] = useState(0)
  const [loading, setLoading] = useState(false)
  const [activeId, setActiveId] = useState(
    initialQuestions.find((q) => q.is_active)?.id || null
  )
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editType, setEditType] = useState('open')
  const [editOptions, setEditOptions] = useState(['', ''])
  const [editCorrectAnswer, setEditCorrectAnswer] = useState(null)
  const [editTimer, setEditTimer] = useState(0)
  const [importing, setImporting] = useState(false)
  const [importStatus, setImportStatus] = useState(null)
  const fileInputRef = useRef(null)

  async function addQuestion(e) {
    e.preventDefault()
    if (!newText.trim()) return
    setLoading(true)

    const options = newType === 'multiple_choice' ? newOptions.filter((o) => o.trim()) : null
    const correctAnswer = isExam && newType === 'multiple_choice' && newCorrectAnswer !== null
      ? newCorrectAnswer
      : null

    const res = await fetch(`/api/sessions/${sessionId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: newText,
        type: newType,
        options,
        correct_answer: correctAnswer,
        timer_seconds: newTimer || 0,
        order: questions.length,
      }),
    })

    if (res.ok) {
      const q = await res.json()
      setQuestions((prev) => [...prev, q])
      setNewText('')
      setNewType('open')
      setNewOptions(['', ''])
      setNewCorrectAnswer(null)
      setNewTimer(0)
      setShowForm(false)
    }
    setLoading(false)
  }

  async function deleteQuestion(id) {
    if (!confirm('Hapus pertanyaan ini?')) return
    const res = await fetch(`/api/sessions/${sessionId}/questions/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setQuestions((prev) => prev.filter((q) => q.id !== id))
      if (activeId === id) setActiveId(null)
    }
  }

  function startEdit(q) {
    setEditingId(q.id)
    setEditText(q.text)
    setEditType(q.type)
    setEditOptions(q.type === 'multiple_choice' && q.options?.length ? [...q.options] : ['', ''])
    setEditCorrectAnswer(q.correct_answer || null)
    setEditTimer(q.timer_seconds || 0)
    setShowForm(false)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function saveEdit(e) {
    e.preventDefault()
    if (!editText.trim()) return
    setLoading(true)

    const options = editType === 'multiple_choice' ? editOptions.filter((o) => o.trim()) : null
    const correctAnswer = isExam && editType === 'multiple_choice' && editCorrectAnswer !== null
      ? editCorrectAnswer
      : null

    const res = await fetch(`/api/sessions/${sessionId}/questions/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: editText,
        type: editType,
        options,
        correct_answer: correctAnswer,
        timer_seconds: editTimer || 0,
      }),
    })

    if (res.ok) {
      const updated = await res.json()
      setQuestions((prev) => prev.map((q) => q.id === editingId ? updated : q))
      setEditingId(null)
    }
    setLoading(false)
  }

  async function activateQuestion(id) {
    const nextActive = activeId === id ? null : id
    await Promise.all(
      questions.map((q) =>
        fetch(`/api/sessions/${sessionId}/questions/${q.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: q.id === nextActive }),
        })
      )
    )
    setActiveId(nextActive)
    setQuestions((prev) => prev.map((q) => ({ ...q, is_active: q.id === nextActive })))
  }

  function navigateQuestion(direction) {
    const currentIdx = questions.findIndex((q) => q.id === activeId)
    let nextIdx
    if (direction === 'next') {
      nextIdx = currentIdx < questions.length - 1 ? currentIdx + 1 : 0
    } else {
      nextIdx = currentIdx > 0 ? currentIdx - 1 : questions.length - 1
    }
    activateQuestion(questions[nextIdx].id)
  }

  function downloadTemplate() {
    const wsData = [
      ['pertanyaan', 'type', 'pilihan', 'jawaban_benar', 'timer'],
      ['Apa ibu kota Indonesia?', 'pilihan_ganda', 'Jakarta|Surabaya|Bandung|Medan', 'Jakarta', '30'],
      ['Jelaskan proses fotosintesis', 'open', '', '', '60'],
      ['2 + 2 = ?', 'pilihan_ganda', '3|4|5|6', '4', '15'],
    ]
    const ws = utils.aoa_to_sheet(wsData)
    ws['!cols'] = [{ wch: 35 }, { wch: 15 }, { wch: 40 }, { wch: 15 }, { wch: 8 }]
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Soal')

    import('xlsx').then(XLSX => {
      XLSX.writeFile(wb, 'template_soal.xlsx')
    })
  }

  async function handleImportExcel(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setImporting(true)
    setImportStatus({ text: 'Membaca file...', error: false })
    setShowForm(false)
    setEditingId(null)

    try {
      const buffer = await file.arrayBuffer()
      const wb = read(buffer, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = utils.sheet_to_json(ws, { defval: '' })

      if (rows.length === 0) {
        setImportStatus({ text: 'File kosong atau format salah.', error: true })
        setImporting(false)
        return
      }

      const parsed = rows.map((row) => {
        const text = String(row['pertanyaan'] || row['Pertanyaan'] || row['soal'] || row['Soal'] || row['question'] || row['Question'] || '').trim()
        const rawType = String(row['type'] || row['Type'] || row['tipe'] || row['Tipe'] || row['jenis'] || row['Jenis'] || '').trim().toLowerCase()
        const rawOptions = String(row['pilihan'] || row['Pilihan'] || row['options'] || row['Options'] || row['jawaban'] || row['Jawaban'] || '').trim()
        const rawCorrect = String(row['jawaban_benar'] || row['Jawaban_Benar'] || row['jawaban benar'] || row['Jawaban Benar'] || row['correct'] || row['Correct'] || row['correct_answer'] || row['kunci'] || row['Kunci'] || '').trim()
        const rawTimer = parseInt(row['timer'] || row['Timer'] || row['timer_seconds'] || 0) || 0

        let type = 'open'
        if (rawType.includes('pilihan') || rawType.includes('multiple') || rawType.includes('mc') || rawType.includes('pg') || rawType.includes('ganda')) {
          type = 'multiple_choice'
        }

        let options = null
        if (rawOptions) {
          options = rawOptions.split(/[;|]/).map(o => o.trim()).filter(Boolean)
          if (options.length >= 2) type = 'multiple_choice'
          else options = null
        }

        const correct_answer = rawCorrect || null

        return { text, type, options, correct_answer, timer_seconds: rawTimer }
      }).filter(q => q.text)

      if (parsed.length === 0) {
        setImportStatus({ text: 'Tidak ada pertanyaan valid. Pastikan kolom "pertanyaan" terisi.', error: true })
        setImporting(false)
        return
      }

      setImportStatus({ text: `Mengimpor ${parsed.length} soal...`, error: false })

      const created = []
      for (let i = 0; i < parsed.length; i++) {
        const q = parsed[i]
        const res = await fetch(`/api/sessions/${sessionId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...q,
            order: questions.length + i,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          created.push(data)
        }
        setImportStatus({ text: `Mengimpor ${i + 1} / ${parsed.length} soal...`, error: false })
      }

      setQuestions((prev) => [...prev, ...created])
      setImportStatus({ text: `Berhasil import ${created.length} soal!`, error: false })
      setTimeout(() => setImportStatus(null), 3000)
    } catch {
      setImportStatus({ text: 'Gagal membaca file. Pastikan format .xlsx/.xls yang valid.', error: true })
    }
    setImporting(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white text-sm">Pertanyaan</h3>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImportExcel}
            className="hidden"
          />
          <button
            onClick={downloadTemplate}
            className="text-[10px] text-white/20 hover:text-white/50 transition-colors"
            title="Download template Excel"
          >
            📄 Template
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="text-xs text-white/30 hover:text-amber-400 font-semibold transition-colors disabled:opacity-50"
          >
            📥 Import
          </button>
          <button
            onClick={() => { setShowForm((v) => !v); setEditingId(null) }}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors"
          >
            {showForm ? '✕ Batal' : '+ Tambah'}
          </button>
        </div>
      </div>

      {importStatus && (
        <div className={`rounded-xl px-3.5 py-2.5 mb-3 text-xs font-medium ${
          importStatus.error
            ? 'bg-red-500/10 border border-red-500/20 text-red-400'
            : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
        }`}>
          {importStatus.text}
        </div>
      )}

      {/* Presentation nav (quiz only, not exam) */}
      {!isExam && questions.length > 1 && (
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => navigateQuestion('prev')}
            className="px-2.5 py-1 rounded-lg bg-white/5 text-white/40 hover:text-white/80 hover:bg-white/10 text-xs transition-colors"
          >
            ← Prev
          </button>
          <span className="text-white/20 text-xs flex-1 text-center">
            {activeId ? `${questions.findIndex((q) => q.id === activeId) + 1} / ${questions.length}` : '—'}
          </span>
          <button
            onClick={() => navigateQuestion('next')}
            className="px-2.5 py-1 rounded-lg bg-white/5 text-white/40 hover:text-white/80 hover:bg-white/10 text-xs transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {isExam && questions.length > 0 && (
        <p className="text-white/30 text-xs mb-3">
          Mahasiswa akan mengerjakan {questions.length} soal secara berurutan.
        </p>
      )}

      {showForm && (
        <form onSubmit={addQuestion} className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 mb-4 space-y-3">
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            rows={2}
            required
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-amber-400 focus:outline-none text-white text-sm resize-none placeholder:text-white/20"
            placeholder="Tulis pertanyaan..."
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-white/30 mb-1 uppercase">Jenis</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-amber-400 focus:outline-none text-white text-sm"
              >
                <option value="open">Jawaban Bebas</option>
                <option value="multiple_choice">Pilihan Ganda</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-white/30 mb-1 uppercase">Timer (detik)</label>
              <input
                type="number"
                min={0}
                max={300}
                value={newTimer}
                onChange={(e) => setNewTimer(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-amber-400 focus:outline-none text-white text-sm"
                placeholder="0 = tanpa timer"
              />
            </div>
          </div>

          {newType === 'multiple_choice' && (
            <div className="space-y-2">
              <label className="block text-[10px] font-semibold text-white/30 uppercase">Pilihan</label>
              {newOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={opt}
                    onChange={(e) => {
                      const opts = [...newOptions]
                      opts[i] = e.target.value
                      setNewOptions(opts)
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-amber-400 focus:outline-none text-white text-sm placeholder:text-white/20"
                    placeholder={`Pilihan ${String.fromCharCode(65 + i)}`}
                  />
                  {isExam && opt.trim() && (
                    <button
                      type="button"
                      onClick={() => setNewCorrectAnswer(newCorrectAnswer === opt ? null : opt)}
                      className={`shrink-0 text-[10px] px-2 py-1.5 rounded-lg font-bold transition-colors ${
                        newCorrectAnswer === opt
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-white/5 text-white/25 hover:text-white/50 border border-white/5'
                      }`}
                      title="Tandai sebagai jawaban benar"
                    >
                      {newCorrectAnswer === opt ? '✓ Benar' : '✓'}
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setNewOptions([...newOptions, ''])} className="text-xs text-amber-400 hover:underline">
                + Tambah pilihan
              </button>
              {isExam && newOptions.some(o => o.trim()) && !newCorrectAnswer && (
                <p className="text-amber-400/60 text-[10px]">Klik ✓ di samping pilihan untuk menandai jawaban benar</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/60 transition-colors">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
            >
              {loading ? 'Saving...' : 'Simpan'}
            </button>
          </div>
        </form>
      )}

      {questions.length === 0 ? (
        <p className="text-white/20 text-sm py-6 text-center">Belum ada pertanyaan.</p>
      ) : (
        <div className="space-y-1.5">
          {questions.map((q, i) => (
            editingId === q.id ? (
              <form key={q.id} onSubmit={saveEdit} className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Edit Soal {i + 1}</span>
                  <button type="button" onClick={cancelEdit} className="text-xs text-white/30 hover:text-white/60">✕</button>
                </div>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={2}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-amber-400 focus:outline-none text-white text-sm resize-none placeholder:text-white/20"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-white/30 mb-1 uppercase">Jenis</label>
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-amber-400 focus:outline-none text-white text-sm"
                    >
                      <option value="open">Jawaban Bebas</option>
                      <option value="multiple_choice">Pilihan Ganda</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-white/30 mb-1 uppercase">Timer (detik)</label>
                    <input
                      type="number"
                      min={0}
                      max={300}
                      value={editTimer}
                      onChange={(e) => setEditTimer(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-amber-400 focus:outline-none text-white text-sm"
                    />
                  </div>
                </div>
                {editType === 'multiple_choice' && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-semibold text-white/30 uppercase">Pilihan</label>
                    {editOptions.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          value={opt}
                          onChange={(e) => {
                            const opts = [...editOptions]
                            opts[oi] = e.target.value
                            setEditOptions(opts)
                          }}
                          className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-amber-400 focus:outline-none text-white text-sm placeholder:text-white/20"
                          placeholder={`Pilihan ${String.fromCharCode(65 + oi)}`}
                        />
                        {isExam && opt.trim() && (
                          <button
                            type="button"
                            onClick={() => setEditCorrectAnswer(editCorrectAnswer === opt ? null : opt)}
                            className={`shrink-0 text-[10px] px-2 py-1.5 rounded-lg font-bold transition-colors ${
                              editCorrectAnswer === opt
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-white/5 text-white/25 hover:text-white/50 border border-white/5'
                            }`}
                          >
                            {editCorrectAnswer === opt ? '✓ Benar' : '✓'}
                          </button>
                        )}
                        {editOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const opts = editOptions.filter((_, idx) => idx !== oi)
                              setEditOptions(opts)
                              if (editCorrectAnswer === opt) setEditCorrectAnswer(null)
                            }}
                            className="shrink-0 text-[10px] px-1.5 py-1.5 rounded-lg text-red-400/40 hover:text-red-400"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => setEditOptions([...editOptions, ''])} className="text-xs text-amber-400 hover:underline">
                      + Tambah pilihan
                    </button>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={cancelEdit} className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/60 transition-colors">
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                  >
                    {loading ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            ) : (
              <div
                key={q.id}
                className={`rounded-xl border p-3 flex items-start gap-3 transition-all ${
                  !isExam && q.is_active
                    ? 'border-amber-500/30 bg-amber-500/10'
                    : 'border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                <span className="text-xs font-bold text-white/20 mt-0.5 w-5 shrink-0 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/90 leading-snug">{q.text}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] text-white/25">
                      {q.type === 'open' ? 'Bebas' : 'Pilihan ganda'}
                    </span>
                    {q.timer_seconds > 0 && (
                      <span className="text-[10px] text-amber-400/60">⏱ {q.timer_seconds}s</span>
                    )}
                    {isExam && q.correct_answer && (
                      <span className="text-[10px] text-emerald-400/60">✓ {q.correct_answer}</span>
                    )}
                    {!isExam && q.is_active && (
                      <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-bold">AKTIF</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(q)}
                    className="text-[10px] px-1.5 py-1 rounded-lg text-white/25 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                    title="Edit"
                  >
                    ✎
                  </button>
                  {!isExam && (
                    <button
                      onClick={() => activateQuestion(q.id)}
                      className={`text-[10px] px-2 py-1 rounded-lg font-bold transition-colors ${
                        q.is_active
                          ? 'bg-amber-500 text-white hover:bg-amber-400'
                          : 'bg-white/5 text-white/30 hover:text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {q.is_active ? 'ON' : 'OFF'}
                    </button>
                  )}
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="text-[10px] px-1.5 py-1 rounded-lg text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  )
}
