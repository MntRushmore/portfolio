"use client"

interface ErrorDialogProps {
  title: string
  message: string
  onClose: () => void
}

export default function ErrorDialog({ title, message, onClose }: ErrorDialogProps) {
  const playClickSound = () => {
    const audio = new Audio("/click.mp3")
    audio.volume = 0.3
    audio.play().catch(() => {
      // Autoplay was prevented
    })
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="w-80 bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-gray-700 border-b-gray-700 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-7 bg-white text-black font-bold flex items-center px-2">{title}</div>
        <div className="p-4 flex gap-4 bg-gray-900 text-white">
          <div className="text-4xl">⚠️</div>
          <div className="flex-1">{message}</div>
        </div>
        <div className="p-2 flex justify-center bg-gray-900">
          <button
            className="px-4 py-1 bg-gray-800 text-white border-2 border-t-white border-l-white border-r-gray-700 border-b-gray-700 active:border-t-gray-700 active:border-l-gray-700 active:border-r-white active:border-b-white"
            onClick={() => {
              playClickSound()
              onClose()
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
