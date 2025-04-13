"use client"

import { useState, useEffect } from "react"
import Window from "@/components/window"
import Taskbar from "@/components/taskbar"
import StartMenu from "@/components/start-menu"
import { apps } from "@/lib/apps"
import type { AppWindow } from "@/lib/types"
import { cn } from "@/lib/utils"
import ErrorDialog from "@/components/error-dialog"

export default function Desktop() {
  const [openWindows, setOpenWindows] = useState<AppWindow[]>([])
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null)
  const [time, setTime] = useState<string>("")
  const [showStartMenu, setShowStartMenu] = useState<boolean>(false)
  const [showError, setShowError] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>("")

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
    }

    updateTime()
    const interval = setInterval(updateTime, 60000)

    // Show welcome message after a delay
    setTimeout(() => {
      openApp("welcome")
    }, 1000)

    // Random system error
    const errorTimeout = setTimeout(() => {
      setErrorMessage("System resources low. Close some applications to improve performance.")
      setShowError(true)
    }, 120000) // Show after 2 minutes

    return () => {
      clearInterval(interval)
      clearTimeout(errorTimeout)
    }
  }, [])

  const playClickSound = () => {
    const audio = new Audio("/click.mp3")
    audio.volume = 0.3
    audio.play().catch(() => {
      // Autoplay was prevented
    })
  }

  const openApp = (appId: string) => {
    const app = apps.find((a) => a.id === appId)
    if (!app) return

    playClickSound()

    // Check if app is already open
    const existingWindow = openWindows.find((w) => w.appId === appId)
    if (existingWindow) {
      // Bring to front
      setActiveWindowId(existingWindow.id)
      return
    }

    // Play window open sound
    const audio = new Audio("/window-open.mp3")
    audio.volume = 0.3
    audio.play().catch(() => {
      // Autoplay was prevented
    })

    const newWindow: AppWindow = {
      id: `window-${Date.now()}`,
      appId,
      title: app.title,
      icon: app.icon,
      content: app.content,
      position: { x: 50 + openWindows.length * 20, y: 50 + openWindows.length * 20 },
      size: app.defaultSize || { width: 600, height: 400 },
      isMinimized: false,
    }

    setOpenWindows([...openWindows, newWindow])
    setActiveWindowId(newWindow.id)
  }

  const closeWindow = (windowId: string) => {
    // Play window close sound
    const audio = new Audio("/window-close.mp3")
    audio.volume = 0.3
    audio.play().catch(() => {
      // Autoplay was prevented
    })

    setOpenWindows(openWindows.filter((w) => w.id !== windowId))
    if (activeWindowId === windowId) {
      const remainingWindows = openWindows.filter((w) => w.id !== windowId)
      setActiveWindowId(remainingWindows.length > 0 ? remainingWindows[remainingWindows.length - 1].id : null)
    }
  }

  const minimizeWindow = (windowId: string) => {
    setOpenWindows(openWindows.map((w) => (w.id === windowId ? { ...w, isMinimized: true } : w)))

    // Set active window to the next non-minimized window
    const nonMinimizedWindows = openWindows.filter((w) => !w.isMinimized && w.id !== windowId)
    if (nonMinimizedWindows.length > 0) {
      setActiveWindowId(nonMinimizedWindows[nonMinimizedWindows.length - 1].id)
    } else {
      setActiveWindowId(null)
    }
  }

  const restoreWindow = (windowId: string) => {
    setOpenWindows(openWindows.map((w) => (w.id === windowId ? { ...w, isMinimized: false } : w)))
    setActiveWindowId(windowId)
  }

  const bringToFront = (windowId: string) => {
    setActiveWindowId(windowId)
  }

  const toggleStartMenu = () => {
    playClickSound()
    setShowStartMenu(!showStartMenu)
  }

  return (
    <div className="relative w-full h-screen overflow-hidden select-none bg-black">
      {/* CRT overlay will be added at the bottom of the component */}
      <div
        className="absolute inset-0 pt-0 pb-9 px-0 flex flex-col"
        onClick={() => {
          setActiveWindowId(null)
          setShowStartMenu(false)
        }}
      >
        {/* Desktop Icons */}
        <div className="grid grid-cols-6 gap-1 p-2 sm:grid-cols-8 md:grid-cols-12">
          {apps.map((app) => (
            <div
              key={app.id}
              className="flex flex-col items-center justify-center gap-1 p-1 rounded hover:bg-blue-700/30 cursor-pointer transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                openApp(app.id)
              }}
              onDoubleClick={(e) => {
                e.stopPropagation()
                openApp(app.id)
              }}
            >
              <div className="w-12 h-12 flex items-center justify-center">{app.icon}</div>
              <span className="text-xs font-medium text-center text-white px-1 py-0.5 rounded bg-blue-900/70 shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
                {app.title}
              </span>
            </div>
          ))}
        </div>

        {/* Windows */}
        {openWindows.map(
          (window) =>
            !window.isMinimized && (
              <Window
                key={window.id}
                window={window}
                isActive={activeWindowId === window.id}
                onClose={() => closeWindow(window.id)}
                onMinimize={() => minimizeWindow(window.id)}
                onFocus={() => bringToFront(window.id)}
              />
            ),
        )}
      </div>

      {/* Start Menu */}
      {showStartMenu && <StartMenu onAppClick={openApp} onClose={() => setShowStartMenu(false)} />}

      {/* Taskbar */}
      <Taskbar
        time={time}
        openWindows={openWindows}
        activeWindowId={activeWindowId}
        onWindowClick={(windowId) => {
          playClickSound()
          const window = openWindows.find((w) => w.id === windowId)
          if (window?.isMinimized) {
            restoreWindow(windowId)
          } else if (activeWindowId === windowId) {
            minimizeWindow(windowId)
          } else {
            bringToFront(windowId)
          }
        }}
        onStartClick={toggleStartMenu}
        showStartMenu={showStartMenu}
      />

      {/* Error Dialog */}
      {showError && <ErrorDialog title="System Warning" message={errorMessage} onClose={() => setShowError(false)} />}

      {/* CRT Effect */}
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
