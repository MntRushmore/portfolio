export default function AboutApp() {
  return (
    <div className="p-2 font-['MS_Sans_Serif',sans-serif] space-y-4 bg-gray-900 border border-white h-full overflow-auto">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto bg-gray-800 border-2 border-white rounded-full flex items-center justify-center">
          <span className="text-4xl">👤</span>
        </div>
        <h1 className="text-xl font-bold mt-2 text-white">Rushil Chopra</h1>
        <p className="text-sm text-gray-400">Student & Non-Profit Co-Founder</p>
      </div>

      <div className="bg-gray-800 border border-white p-2">
        <h2 className="font-bold underline text-white">About Me:</h2>
        <p className="text-sm mt-1 text-white">
          Hello! I'm Rushil, a passionate student and the co-founder of a non-profit organization. I love exploring technology, and I'm always eager to learn new things. In my free time, I enjoy working on personal projects and hanging out with family!
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
            <span>Problem Solving</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-white">
            <div className="w-3 h-3 bg-white"></div>
            <span>Teaching Yoga</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-white">
            <div className="w-3 h-3 bg-white"></div>
            <span>Diving</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-white">
            <div className="w-3 h-3 bg-white"></div>
            <span>Video Editing</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-white">
            <div className="w-3 h-3 bg-white"></div>
            <span>Business</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-white">
            <div className="w-3 h-3 bg-white"></div>
            <span>Python</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-white">
            <div className="w-3 h-3 bg-white"></div>
            <span>Leadership</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-white">
            <div className="w-3 h-3 bg-white"></div>
            <span>Making Friends!</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 border border-white p-2">
        <h2 className="font-bold underline text-white">Interests:</h2>
        <ul className="list-disc pl-5 text-sm mt-1 space-y-1 text-white">
          <li>Business</li>
          <li>Aviation</li>
          <li>Web Development</li>
          <li>Yoga</li>
          <li>Volunteering</li>
          <li>Robotics</li>
        </ul>
      </div>

      <div className="text-center text-xs text-gray-400 mt-4">
        <p>Double-click on other desktop icons to learn more about me!</p>
      </div>
    </div>
  )
}
