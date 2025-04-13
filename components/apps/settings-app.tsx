export default function SettingsApp() {
  return (
    <div className="p-2 font-['MS_Sans_Serif',sans-serif] space-y-3 bg-white border border-gray-400 h-full overflow-auto">
      <div className="text-center">
        <h1 className="text-xl font-bold">Control Panel</h1>
        <p className="text-xs text-gray-600">System settings and preferences</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="border border-gray-400 p-2 hover:bg-blue-100 cursor-pointer">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🖥️</span>
            <span className="text-sm font-bold">Display</span>
          </div>
          <p className="text-xs mt-1">Change screen resolution and colors</p>
        </div>

        <div className="border border-gray-400 p-2 hover:bg-blue-100 cursor-pointer">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔊</span>
            <span className="text-sm font-bold">Sound</span>
          </div>
          <p className="text-xs mt-1">Adjust volume and sound effects</p>
        </div>

        <div className="border border-gray-400 p-2 hover:bg-blue-100 cursor-pointer">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🖱️</span>
            <span className="text-sm font-bold">Mouse</span>
          </div>
          <p className="text-xs mt-1">Change pointer speed and appearance</p>
        </div>

        <div className="border border-gray-400 p-2 hover:bg-blue-100 cursor-pointer">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⌨️</span>
            <span className="text-sm font-bold">Keyboard</span>
          </div>
          <p className="text-xs mt-1">Adjust keyboard settings</p>
        </div>

        <div className="border border-gray-400 p-2 hover:bg-blue-100 cursor-pointer">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎨</span>
            <span className="text-sm font-bold">Appearance</span>
          </div>
          <p className="text-xs mt-1">Change desktop theme and colors</p>
        </div>

        <div className="border border-gray-400 p-2 hover:bg-blue-100 cursor-pointer">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔒</span>
            <span className="text-sm font-bold">Security</span>
          </div>
          <p className="text-xs mt-1">Manage system security settings</p>
        </div>
      </div>

      <div className="border border-gray-400 p-2 bg-gray-100">
        <h2 className="text-sm font-bold">System Information</h2>
        <div className="text-xs mt-1 space-y-1">
          <div className="flex justify-between">
            <span>Operating System:</span>
            <span>RetroOS v1.0.4</span>
          </div>
          <div className="flex justify-between">
            <span>Processor:</span>
            <span>486DX 66MHz</span>
          </div>
          <div className="flex justify-between">
            <span>Memory:</span>
            <span>16 MB RAM</span>
          </div>
          <div className="flex justify-between">
            <span>Hard Disk:</span>
            <span>540 MB</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button className="px-4 py-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-gray-700 border-b-gray-700 active:border-t-gray-700 active:border-l-gray-700 active:border-r-white active:border-b-white">
          OK
        </button>
      </div>
    </div>
  )
}
