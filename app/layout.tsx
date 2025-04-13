import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rushil Chopra',
  description: 'Created by Rushil Chopra',
  keywords: 'Rushil, Rushil Chopra, RushilChopra, RushilChopra.com',
  authors: [{ name: 'Rushil Chopra', url: 'https://rushilchopra.com' }],
  creator: 'Rushil Chopra',
  openGraph: {
    title: 'Rushil Chopra',
    description: 'Created by Rushil Chopra',
    url: 'https://rushilchopra.com',
    siteName: 'Rushil Chopra',
  generator: 'rushilchopra.com',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
