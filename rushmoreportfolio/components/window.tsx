"use client"

import { useState, useRef } from "react"
import Draggable from "react-draggable"
import { X, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AppWindow } from "@/lib/types"

interface WindowProps {
  window: AppWindow
  isActive: boolean
  onClose: () => void
  onMinimize: () => void
  onFocus: () => void
}

export default function Window({ window, isActive, onClose, onMinimize, onFocus }: WindowProps) {
  const [size, setSize] = useState(window.size)
  const nodeRef = useRef(null)

  const playClickSound = () => {
    const audio = new Audio("/click.mp3")
    audio.volume = 0.3
    audio.play().catch(() => {
      // Autoplay was prevented
    })
  }

  return (
    <Draggable nodeRef={nodeRef} handle=".window-handle" defaultPosition={window.position} bounds="parent">
      <div
        ref={nodeRef}
        className={cn(
          "absolute overflow-hidden flex flex-col",
          "border-2 border-white shadow-[3px_3px_0px_rgba(255,255,255,0.2)]",
          isActive ? "z-10" : "z-0",
        )}
        style={{ width: size.width, height: size.height }}
        onClick={(e) => {
          e.stopPropagation()
          onFocus()
        }}
      >
        {/* Window Header */}
        <div
          className={cn(
            "window-handle h-7 flex items-center px-1 gap-1 cursor-move",
            isActive ? "bg-white text-black" : "bg-gray-700 text-white",
          )}
        >
          <div className="flex items-center gap-1">
            <div className="w-4 h-4">{window.icon}</div>
            <div className="flex-1 text-center text-xs font-bold truncate">{window.title}</div>
          </div>
          <div className="flex">
            <button
              onClick={(e) => {
                e.stopPropagation()
                playClickSound()
                onMinimize()
              }}
              className="w-5 h-5 flex items-center justify-center bg-[#c0c0c0] border-t border-l border-white border-r border-b border-r-gray-500 border-b-gray-500 hover:bg-gray-300 active:border-r active:border-b active:border-white active:border-t-gray-500 active:border-l-gray-500"
            >
              <Minus className="w-3 h-3 text-black" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                playClickSound()
                onClose()
              }}
              className="w-5 h-5 ml-1 flex items-center justify-center bg-[#c0c0c0] border-t border-l border-white border-r border-b border-r-gray-500 border-b-gray-500 hover:bg-gray-300 active:border-r active:border-b active:border-white active:border-t-gray-500 active:border-l-gray-500"
            >
              <X className="w-3 h-3 text-black" />
            </button>
          </div>
        </div>

        {/* Window Content */}
        <div className="flex-1 overflow-auto p-2 bg-gray-900 text-white">{window.content}</div>
      </div>
    </Draggable>
  )
}
