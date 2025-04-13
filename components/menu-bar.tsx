"use client"

import { useState, useEffect } from "react"
import { MoonStar, Sun, Wifi, Battery, Volume2 } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"

interface MenuBarProps {
  time: string
}

export default function MenuBar({ time }: MenuBarProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [batteryLevel, setBatteryLevel] = useState(100)

  useEffect(() => {
    setMounted(true)
    // Simulate battery drain
    const interval = setInterval(() => {
      setBatteryLevel((prev) => {
        const newLevel = prev - Math.random() * 0.5
        return newLevel < 10 ? 100 : newLevel
      })
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  if (!mounted) return null

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-6 bg-white/20 dark:bg-black/20 backdrop-blur-lg z-50 flex items-center justify-between px-4 text-xs font-medium text-primary"
      initial={{ y: -30 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <div className="flex items-center gap-4">
        <span className="font-bold">PortfolioOS</span>
        <span>File</span>
        <span>Edit</span>
        <span>View</span>
        <span>Help</span>
      </div>

      <div className="flex items-center gap-3">
        <Wifi className="w-3.5 h-3.5" />
        <Volume2 className="w-3.5 h-3.5" />
        <div className="flex items-center gap-1">
          <Battery className="w-3.5 h-3.5" />
          <span>{Math.round(batteryLevel)}%</span>
        </div>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center justify-center"
        >
          {theme === "dark" ? <MoonStar className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        </button>
        <span>{time}</span>
      </div>
    </motion.div>
  )
}
