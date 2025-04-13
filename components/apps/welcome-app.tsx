export default function WelcomeApp() {
  return (
    <div className="p-2 font-['MS_Sans_Serif',sans-serif] space-y-4 bg-gray-900 border border-white h-full overflow-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Welcome to MonoOS!</h1>
        <p className="text-sm mt-2">Your monochrome portfolio experience</p>
      </div>

      <div className="text-sm space-y-3">
        <p>
          Welcome to my portfolio presented as a retro operating system! This interface is designed to showcase my work
          in a fun, nostalgic way.
        </p>

        <p>
          <span className="font-bold">Getting Started:</span>
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Click on desktop icons to open applications</li>
          <li>Use the Start menu to navigate between apps</li>
          <li>Drag windows by their title bars to move them</li>
          <li>Minimize, maximize, or close windows using the buttons in the top-right corner</li>
        </ul>

        <p>
          <span className="font-bold">Available Applications:</span>
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <span className="font-bold">About Me</span> - Learn about who I am
          </li>
          <li>
            <span className="font-bold">My Projects</span> - Browse my portfolio work
          </li>
          <li>
            <span className="font-bold">Resume.doc</span> - View my professional experience
          </li>
          <li>
            <span className="font-bold">Contact</span> - Get in touch with me
          </li>
          <li>
            <span className="font-bold">MS-DOS Prompt</span> - Try some commands!
          </li>
          <li>And more to explore!</li>
        </ul>

        <div className="bg-gray-800 border border-white p-2 text-xs">
          <p className="font-bold">TIP:</p>
          <p>Try typing &quot;help&quot; in the MS-DOS Prompt to discover hidden commands!</p>
        </div>
      </div>

      <div className="text-center text-xs text-gray-600 mt-4">
        <p>RetroOS v1.0 © 2023</p>
        <p>640K of memory should be enough for anybody</p>
      </div>
    </div>
  )
}
