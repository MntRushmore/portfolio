"use client"

import { useState, useEffect } from "react"
import Desktop from "@/components/desktop"
import { cn } from "@/lib/utils"

export default function BootSequence() {
  const [bootStage, setBootStage] = useState<number>(0)
  const [bootText, setBootText] = useState<string[]>([])
  const [showDesktop, setShowDesktop] = useState<boolean>(false)

  useEffect(() => {
    // Play startup sound
    const audio = new Audio("/startup.mp3")
    audio.volume = 0.5
    audio.play().catch(() => {
      // Autoplay was prevented, we'll continue without sound
    })

    // Boot sequence
    const bootMessages = [
      "BIOS Version 1.0.4 (c)1995",
      "Memory Test: 640K OK",
      "Initializing Hard Drive...",
      "Loading System Files...",
      "HIMEM.SYS loaded",
      "MOUSE.SYS loaded",
      "Starting PortfolioOS v1.0...",
      "Welcome to Rushil Chopra's Portfolio",
    ]

    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex < bootMessages.length) {
        setBootText((prev) => [...prev, bootMessages[currentIndex]])
        currentIndex++
      } else {
        clearInterval(interval)
        setTimeout(() => {
          setBootStage(1) // Show logo
          setTimeout(() => {
            setBootStage(2) // Show loading bar
            setTimeout(() => {
              setShowDesktop(true) // Finally show desktop
            }, 3000)
          }, 2000)
        }, 1000)
      }
    }, 300)

    return () => clearInterval(interval)
  }, [])

  if (showDesktop) {
    return <Desktop />
  }

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-green-500 font-mono">
      {bootStage === 0 && (
        <div className="max-w-md w-full">
          <div className="text-sm whitespace-pre-line">
            {bootText.map((text: string, index: number) => (
              <div key={index} className="mb-1">
                {text}
              </div>
            ))}
          </div>
        </div>
      )}

      {bootStage === 1 && (
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-2 text-white">MonoOS</h1>
          <p className="text-xl text-white">Version 1.0</p>
        </div>
      )}

      {bootStage === 2 && (
        <div className="text-center space-y-8">
          <h1 className="text-4xl font-bold mb-2 text-white">Loading MonoOS...</h1>
          <div className="w-64 h-6 border-2 border-white bg-black relative overflow-hidden">
            <div className="absolute inset-0.5 bg-white animate-progress-bar" />
          </div>
          <p className="text-sm text-white animate-pulse">Please wait...</p>
        </div>
      )}

      <div
        className={cn(
          "fixed inset-0 pointer-events-none",
          "after:content-[''] after:fixed after:inset-0 after:bg-[url('/scanline.png')] after:opacity-10 after:pointer-events-none",
          "before:content-[''] before:fixed before:inset-0 before:bg-[radial-gradient(circle,transparent_30%,black_150%)] before:opacity-20 before:pointer-events-none",
        )}
      />
    </div>
  )
}
