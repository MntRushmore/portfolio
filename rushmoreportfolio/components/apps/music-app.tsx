export default function MusicApp() {
  return (
    <div className="p-2 font-['MS_Sans_Serif',sans-serif] space-y-3 bg-white border border-gray-400 h-full overflow-auto">
      <div className="text-center">
        <h1 className="text-xl font-bold">Media Player</h1>
        <p className="text-xs text-gray-600">Version 1.0</p>
      </div>

      <div className="border-2 border-gray-400 p-2 bg-gray-200">
        <div className="bg-gray-800 border border-gray-600 p-2 flex items-center justify-center">
          <div className="text-6xl">🎵</div>
        </div>

        <div className="text-center mt-2">
          <div className="text-sm font-bold">Now Playing</div>
          <div className="text-xs">Ambient Melody - Ambient Artist</div>
        </div>

        <div className="mt-2 border border-gray-600 bg-white h-2">
          <div className="bg-blue-800 h-full w-1/3"></div>
        </div>

        <div className="flex justify-between text-xs mt-1">
          <span>1:15</span>
          <span>3:45</span>
        </div>

        <div className="flex justify-center gap-2 mt-2">
          <button className="px-3 py-1 border-2 border-t-white border-l-white border-r-gray-700 border-b-gray-700 bg-[#c0c0c0]">
            ⏮️
          </button>
          <button className="px-3 py-1 border-2 border-t-white border-l-white border-r-gray-700 border-b-gray-700 bg-[#c0c0c0]">
            ⏯️
          </button>
          <button className="px-3 py-1 border-2 border-t-white border-l-white border-r-gray-700 border-b-gray-700 bg-[#c0c0c0]">
            ⏭️
          </button>
          <button className="px-3 py-1 border-2 border-t-white border-l-white border-r-gray-700 border-b-gray-700 bg-[#c0c0c0]">
            🔊
          </button>
        </div>
      </div>

      <div className="border border-gray-400 p-1">
        <div className="text-sm font-bold mb-1">Playlist</div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between p-1 bg-blue-800 text-white">
            <span>1. Ambient Melody</span>
            <span>3:45</span>
          </div>
          <div className="flex justify-between p-1 hover:bg-blue-100">
            <span>2. Chill Vibes</span>
            <span>4:20</span>
          </div>
          <div className="flex justify-between p-1 hover:bg-blue-100">
            <span>3. Lofi Study</span>
            <span>2:55</span>
          </div>
          <div className="flex justify-between p-1 hover:bg-blue-100">
            <span>4. Deep Focus</span>
            <span>5:10</span>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-600 mt-4">
        <p>Double-click any song to play</p>
        <p>Media Player © 1995</p>
      </div>
    </div>
  )
}
