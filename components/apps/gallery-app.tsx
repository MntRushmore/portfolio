export default function GalleryApp() {
  return (
    <div className="p-2 font-['MS_Sans_Serif',sans-serif] space-y-3 bg-white border border-gray-400 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Photo Viewer</h1>
        <div className="flex gap-1">
          <button className="px-2 py-0.5 border border-gray-400 bg-gray-200 text-xs">View</button>
          <button className="px-2 py-0.5 border border-gray-400 bg-gray-200 text-xs">Help</button>
        </div>
      </div>

      <div className="border border-gray-400 p-1 bg-gray-100">
        <div className="flex gap-1 mb-1">
          <button className="px-2 py-0.5 border border-gray-400 bg-gray-200 text-xs">Previous</button>
          <button className="px-2 py-0.5 border border-gray-400 bg-gray-200 text-xs">Next</button>
          <button className="px-2 py-0.5 border border-gray-400 bg-gray-200 text-xs">Slideshow</button>
        </div>

        <div className="border-2 border-gray-600 bg-gray-800 p-1">
          <img
            src="/placeholder.svg?height=300&width=400"
            alt="Project Screenshot"
            className="w-full h-auto object-contain"
          />
        </div>

        <div className="text-xs text-center mt-1">Image 1 of 6: Project Screenshot</div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="border border-gray-400 p-1 cursor-pointer hover:bg-blue-100">
          <img
            src="/placeholder.svg?height=100&width=100"
            alt="Thumbnail 1"
            className="w-full h-auto aspect-square object-cover"
          />
        </div>
        <div className="border border-gray-400 p-1 cursor-pointer hover:bg-blue-100">
          <img
            src="/placeholder.svg?height=100&width=100"
            alt="Thumbnail 2"
            className="w-full h-auto aspect-square object-cover"
          />
        </div>
        <div className="border border-gray-400 p-1 cursor-pointer hover:bg-blue-100">
          <img
            src="/placeholder.svg?height=100&width=100"
            alt="Thumbnail 3"
            className="w-full h-auto aspect-square object-cover"
          />
        </div>
        <div className="border border-gray-400 p-1 cursor-pointer hover:bg-blue-100">
          <img
            src="/placeholder.svg?height=100&width=100"
            alt="Thumbnail 4"
            className="w-full h-auto aspect-square object-cover"
          />
        </div>
        <div className="border border-gray-400 p-1 cursor-pointer hover:bg-blue-100">
          <img
            src="/placeholder.svg?height=100&width=100"
            alt="Thumbnail 5"
            className="w-full h-auto aspect-square object-cover"
          />
        </div>
        <div className="border border-gray-400 p-1 cursor-pointer hover:bg-blue-100">
          <img
            src="/placeholder.svg?height=100&width=100"
            alt="Thumbnail 6"
            className="w-full h-auto aspect-square object-cover"
          />
        </div>
      </div>

      <div className="text-xs text-gray-600 border-t border-gray-400 pt-1">
        <p>6 items in gallery. Double-click any thumbnail to view full size.</p>
      </div>
    </div>
  )
}
