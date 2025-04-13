// Restore the retro about app

export default function AboutApp() {
  return (
    <div className="p-2 font-['MS_Sans_Serif',sans-serif] space-y-4 bg-gray-900 border border-white h-full overflow-auto">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto bg-gray-800 border-2 border-white rounded-full flex items-center justify-center">
          <span className="text-4xl">👤</span>
        </div>
        <h1 className="text-xl font-bold mt-2 text-white">Your Name</h1>
        <p className="text-sm text-gray-400">Retro Web Developer</p>
      </div>

      <div className="bg-gray-800 border border-white p-2">
        <h2 className="font-bold underline text-white">About Me:</h2>
        <p className="text-sm mt-1 text-white">
          Hello! I'm a passionate web developer with a love for both modern and retro technologies. I create
          user-friendly websites and applications with a focus on creative interfaces and solid functionality.
        </p>
      </div>

      <div className="bg-gray-800 border border-white p-2">
        <h2 className="font-bold underline text-white">Skills:</h2>
        <div className="grid grid-cols-2 gap-1 mt-1">
          <div className="flex items-center gap-1 text-sm text-white">
            <div className="w-3 h-3 bg-white"></div>
            <span>HTML/CSS</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-white">
            <div className="w-3 h-3 bg-white"></div>
            <span>JavaScript</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-white">
            <div className="w-3 h-3 bg-white"></div>
            <span>React</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-white">
            <div className="w-3 h-3 bg-white"></div>
            <span>Next.js</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-white">
            <div className="w-3 h-3 bg-white"></div>
            <span>Node.js</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-white">
            <div className="w-3 h-3 bg-white"></div>
            <span>UI/UX Design</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 border border-white p-2">
        <h2 className="font-bold underline text-white">Interests:</h2>
        <ul className="list-disc pl-5 text-sm mt-1 space-y-1 text-white">
          <li>Retro computing & design</li>
          <li>Open source development</li>
          <li>Digital art & pixel art</li>
          <li>Game development</li>
        </ul>
      </div>

      <div className="text-center text-xs text-gray-400 mt-4">
        <p>Double-click on other desktop icons to learn more about me!</p>
      </div>
    </div>
  )
}
