import './globals.css'
import { Inter } from 'next/font/google'
import React from 'react'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'מערכת RAG למענה על שאלות בנושא מצבי חירום',
  description: 'מערכת מבוססת בינה מלאכותית למענה על שאלות בנושא מצבי חירום',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={inter.className}>{children}</body>
    </html>
  )
} 