export default function ResumeApp() {
  return (
    <div className="p-2 font-['MS_Sans_Serif',sans-serif] space-y-3 bg-white border border-gray-400 h-full overflow-auto">
      <div className="flex justify-between items-center border-b-2 border-gray-400 pb-2">
        <div>
          <h1 className="text-xl font-bold">RESUME.DOC</h1>
          <p className="text-xs text-gray-600">Last modified: 04/13/2025</p>
        </div>
        <div className="flex gap-1">
          <button className="px-2 py-0.5 border border-gray-400 bg-gray-200 text-xs">Print</button>
          <button className="px-2 py-0.5 border border-gray-400 bg-gray-200 text-xs">Save</button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-lg font-bold">Rushil Chopra</h2>
          <p className="text-sm">Student</p>
          <p className="text-xs text-gray-600">rushilchopra@gmail.com | San Francisco, CA</p>
        </div>

        <div>
          <h3 className="text-sm font-bold bg-gray-200 p-1 border-b border-gray-400">PROFESSIONAL SUMMARY</h3>
          <p className="text-xs mt-1 px-1">
            Text here
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold bg-gray-200 p-1 border-b border-gray-400">WORK EXPERIENCE</h3>

          <div className="mt-2 px-1">
            <div className="flex justify-between">
              <h4 className="text-xs font-bold">Student</h4>
              <span className="text-xs">2011 - Present</span>
            </div>
            <p className="text-xs italic">School</p>
            <ul className="list-disc text-xs pl-4 mt-1 space-y-0.5">
              <li>here</li>
              <li>here</li>
              <li>here</li>
            </ul>
          </div>

          <div className="mt-3 px-1">
            <div className="flex justify-between">
              <h4 className="text-xs font-bold">Web Developer</h4>
              <span className="text-xs">2018 - 2021</span>
            </div>
            <p className="text-xs italic">Thing 2</p>
            <ul className="list-disc text-xs pl-4 mt-1 space-y-0.5">
              <li>here</li>
            </ul>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold bg-gray-200 p-1 border-b border-gray-400">EDUCATION</h3>

          <div className="mt-2 px-1">
            <div className="flex justify-between">
              <h4 className="text-xs font-bold">Junipero Serra HS</h4>
              <span className="text-xs">2024 - 2028</span>
            </div>
            <p className="text-xs italic">School Name</p>
          </div>


        <div>
          <h3 className="text-sm font-bold bg-gray-200 p-1 border-b border-gray-400">SKILLS</h3>
          <div className="flex flex-wrap gap-1 mt-1 px-1">
            <span className="text-xs bg-gray-100 border border-gray-400 px-1">HTML/CSS</span>
            <span className="text-xs bg-gray-100 border border-gray-400 px-1">5</span>
            <span className="text-xs bg-gray-100 border border-gray-400 px-1">4</span>
            <span className="text-xs bg-gray-100 border border-gray-400 px-1">4</span>
            <span className="text-xs bg-gray-100 border border-gray-400 px-1">2</span>
            <span className="text-xs bg-gray-100 border border-gray-400 px-1">2</span>
            <span className="text-xs bg-gray-100 border border-gray-400 px-1">2</span>
            <span className="text-xs bg-gray-100 border border-gray-400 px-1">3</span>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-600 mt-4 pt-2 border-t border-gray-400">
        <p>References available upon request</p>
      </div>
    </div>
  )
}
