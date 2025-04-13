// Create a new dock component to replace the taskbar

"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { apps } from "@/lib/apps"
import type { AppWindow } from "@/lib/types"
import { cn } from "@/lib/utils"

interface DockProps {
  openWindows: AppWindow[]
  onAppClick: (appId: string) => void
  onWindowClick: (windowId: string) => void
}

export default function Dock({ openWindows, onAppClick, onWindowClick }: DockProps) {
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null)

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-2 z-50">
      <motion.div
        className="flex items-end gap-1 p-2 rounded-xl bg-white/80 backdrop-blur-lg border border-gray-200 shadow-lg"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {apps.map((app) => {
          const isOpen = openWindows.some((w) => w.appId === app.id)
          const minimizedWindow = openWindows.find((w) => w.appId === app.id && w.isMinimized)

          return (
            <motion.div
              key={app.id}
              className={cn(
                "relative flex flex-col items-center justify-center cursor-pointer",
                isOpen &&
                  "after:content-[''] after:absolute after:bottom-0 after:w-1 after:h-1 after:bg-black after:rounded-full",
              )}
              whileHover={{ scale: 1.2, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onHoverStart={() => setHoveredIcon(app.id)}
              onHoverEnd={() => setHoveredIcon(null)}
              onClick={() => {
                if (minimizedWindow) {
                  onWindowClick(minimizedWindow.id)
                } else {
                  onAppClick(app.id)
                }
              }}
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-100 text-black shadow-sm">
                {app.icon}
              </div>

              {hoveredIcon === app.id && (
                <motion.div
                  className="absolute -top-8 px-2 py-1 bg-black text-white text-xs rounded"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {app.title}
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
