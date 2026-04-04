'use client'
import { QRCodeSVG } from 'qrcode.react'

export default function QRCode({ code }) {
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/quiz/${code}`
    : `/quiz/${code}`

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="bg-white rounded-2xl p-3 inline-block cursor-pointer hover:scale-105 transition-transform">
      <QRCodeSVG value={url} size={120} level="M" />
    </a>
  )
}
