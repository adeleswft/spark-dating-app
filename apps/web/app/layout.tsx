import type { Metadata } from 'next'
import { Space_Grotesk, Inter } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Spark — AI-Powered Dating App',
  description: 'Stop swiping endlessly. Spark uses AI to find your perfect match based on deep compatibility across 5 dimensions. Real connections, powered by real intelligence.',
  keywords: ['dating app', 'AI dating', 'matchmaking', 'compatibility', 'relationships', 'spark dating'],
  authors: [{ name: 'Spark Dating' }],
  openGraph: {
    title: 'Spark — AI-Powered Dating App',
    description: 'Find your perfect match with AI-powered compatibility scoring. 5 dimensions of compatibility, not just photos.',
    url: 'https://spark.dating',
    siteName: 'Spark Dating',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spark — AI-Powered Dating App',
    description: 'Find your perfect match with AI-powered compatibility scoring.',
  },
  robots: { index: true, follow: true },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body style={{ fontFamily: 'var(--font-body), system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
