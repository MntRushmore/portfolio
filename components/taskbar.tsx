"use client"

import { cn } from "@/lib/utils"
import type { AppWindow } from "@/lib/types"

interface TaskbarProps {
  time: string
  openWindows: AppWindow[]
  activeWindowId: string | null
  onWindowClick: (windowId: string) => void
  onStartClick: () => void
  showStartMenu: boolean
}

export default function Taskbar({
  time,
  openWindows,
  activeWindowId,
  onWindowClick,
  onStartClick,
  showStartMenu,
}: TaskbarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-9 bg-gray-900 border-t-2 border-white flex items-center px-1 z-50">
      <button
        className={cn(
          "h-7 px-2 flex items-center gap-1 font-bold text-sm text-white",
          "border-2 border-t-white border-l-white border-r-gray-700 border-b-gray-700",
          "active:border-t-gray-700 active:border-l-gray-700 active:border-r-white active:border-b-white",
          showStartMenu && "bg-white text-black border-t-gray-700 border-l-gray-700 border-r-white border-b-white",
        )}
        onClick={(e) => {
          e.stopPropagation()
          onStartClick()
        }}
      >
        <span className="text-lg">🖥️</span>
        <span>Start</span>
      </button>

      <div className="h-full mx-1 border-l border-gray-700 border-r border-white"></div>

      <div className="flex-1 flex items-center gap-1 overflow-x-auto px-1">
        {openWindows.map((window) => (
          <button
            key={window.id}
            className={cn(
              "h-7 px-2 flex items-center gap-1 text-sm min-w-[120px] max-w-[200px] text-white",
              "border-2",
              activeWindowId === window.id && !window.isMinimized
                ? "bg-white text-black border-t-gray-700 border-l-gray-700 border-r-white border-b-white"
                : "border-t-white border-l-white border-r-gray-700 border-b-gray-700",
            )}
            onClick={() => onWindowClick(window.id)}
          >
            <div className="w-4 h-4 flex-shrink-0">{window.icon}</div>
            <span className="truncate">{window.title}</span>
          </button>
        ))}
      </div>

      <div className="h-full mx-1 border-l border-gray-700 border-r border-white"></div>

      <div className="h-7 px-2 flex items-center text-sm border-2 border-t-gray-700 border-l-gray-700 border-r-white border-b-white text-white">
        {time}
      </div>
    </div>
  )
}
