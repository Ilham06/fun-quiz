'use client'
import { QRCodeSVG } from 'qrcode.react'

export default function QRCode({ code }) {
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/quiz/${code}`
    : `/quiz/${code}`

  return (
    <div className="bg-white rounded-2xl p-3 inline-block">
      <QRCodeSVG value={url} size={120} level="M" />
    </div>
  )
}
