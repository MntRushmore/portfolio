"use client"

import { apps } from "@/lib/apps"

interface StartMenuProps {
  onAppClick: (appId: string) => void
  onClose: () => void
}

export default function StartMenu({ onAppClick, onClose }: StartMenuProps) {
  const playClickSound = () => {
    const audio = new Audio("/click.mp3")
    audio.volume = 0.3
    audio.play().catch(() => {
      // Autoplay was prevented
    })
  }

  return (
    <div
      className="absolute bottom-9 left-0 w-64 bg-gray-900 text-white border-2 border-t-white border-l-white border-r-gray-700 border-b-gray-700 shadow-lg z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-2 bg-white text-black font-bold flex items-center justify-between">
        <span className="text-lg">MonoOS</span>
        <span className="text-xs">v1.0</span>
      </div>

      <div className="p-1">
        {apps.map((app) => (
          <button
            key={app.id}
            className="w-full text-left px-2 py-1 flex items-center gap-2 hover:bg-white hover:text-black"
            onClick={() => {
              playClickSound()
              onAppClick(app.id)
              onClose()
            }}
          >
            <div className="w-5 h-5">{app.icon}</div>
            <span>{app.title}</span>
          </button>
        ))}

        <div className="my-1 border-t border-gray-700 border-b border-white"></div>

        <button
          className="w-full text-left px-2 py-1 flex items-center gap-2 hover:bg-blue-700 hover:text-white"
          onClick={() => {
            playClickSound()
            // Simulate shutdown
            document.body.classList.add("shutdown")
            setTimeout(() => {
              window.location.reload()
            }, 1000)
          }}
        >
          <span className="text-lg">🔌</span>
          <span>Shut Down...</span>
        </button>
      </div>
    </div>
  )
}
