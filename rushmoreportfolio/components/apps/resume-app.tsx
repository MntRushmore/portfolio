export default function ResumeApp() {
  return (
    <div className="p-2 font-['MS_Sans_Serif',sans-serif] space-y-3 bg-white border border-gray-400 h-full overflow-auto">
      <div className="flex justify-between items-center border-b-2 border-gray-400 pb-2">
        <div>
          <h1 className="text-xl font-bold">RESUME.DOC</h1>
          <p className="text-xs text-gray-600">Last modified: 03/15/2023</p>
        </div>
        <div className="flex gap-1">
          <button className="px-2 py-0.5 border border-gray-400 bg-gray-200 text-xs">Print</button>
          <button className="px-2 py-0.5 border border-gray-400 bg-gray-200 text-xs">Save</button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-lg font-bold">YOUR NAME</h2>
          <p className="text-sm">Web Developer & Designer</p>
          <p className="text-xs text-gray-600">email@example.com | (123) 456-7890 | San Francisco, CA</p>
        </div>

        <div>
          <h3 className="text-sm font-bold bg-gray-200 p-1 border-b border-gray-400">PROFESSIONAL SUMMARY</h3>
          <p className="text-xs mt-1 px-1">
            Passionate web developer with expertise in creating responsive, user-friendly applications. Skilled in
            modern frontend frameworks and backend technologies with a focus on clean, maintainable code.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold bg-gray-200 p-1 border-b border-gray-400">WORK EXPERIENCE</h3>

          <div className="mt-2 px-1">
            <div className="flex justify-between">
              <h4 className="text-xs font-bold">Senior Frontend Developer</h4>
              <span className="text-xs">2021 - Present</span>
            </div>
            <p className="text-xs italic">Tech Company Inc.</p>
            <ul className="list-disc text-xs pl-4 mt-1 space-y-0.5">
              <li>Led development of the company's flagship web application</li>
              <li>Implemented responsive design principles across all products</li>
              <li>Mentored junior developers and conducted code reviews</li>
            </ul>
          </div>

          <div className="mt-3 px-1">
            <div className="flex justify-between">
              <h4 className="text-xs font-bold">Web Developer</h4>
              <span className="text-xs">2018 - 2021</span>
            </div>
            <p className="text-xs italic">Digital Agency LLC</p>
            <ul className="list-disc text-xs pl-4 mt-1 space-y-0.5">
              <li>Developed websites and web applications for various clients</li>
              <li>Collaborated with designers to implement pixel-perfect UIs</li>
              <li>Optimized website performance and accessibility</li>
            </ul>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold bg-gray-200 p-1 border-b border-gray-400">EDUCATION</h3>

          <div className="mt-2 px-1">
            <div className="flex justify-between">
              <h4 className="text-xs font-bold">Bachelor of Science in Computer Science</h4>
              <span className="text-xs">2014 - 2018</span>
            </div>
            <p className="text-xs italic">University Name</p>
          </div>

          <div className="mt-2 px-1">
            <div className="flex justify-between">
              <h4 className="text-xs font-bold">Web Development Bootcamp</h4>
              <span className="text-xs">2017</span>
            </div>
            <p className="text-xs italic">Coding Academy</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold bg-gray-200 p-1 border-b border-gray-400">SKILLS</h3>
          <div className="flex flex-wrap gap-1 mt-1 px-1">
            <span className="text-xs bg-gray-100 border border-gray-400 px-1">HTML/CSS</span>
            <span className="text-xs bg-gray-100 border border-gray-400 px-1">JavaScript</span>
            <span className="text-xs bg-gray-100 border border-gray-400 px-1">React</span>
            <span className="text-xs bg-gray-100 border border-gray-400 px-1">Next.js</span>
            <span className="text-xs bg-gray-100 border border-gray-400 px-1">Node.js</span>
            <span className="text-xs bg-gray-100 border border-gray-400 px-1">TypeScript</span>
            <span className="text-xs bg-gray-100 border border-gray-400 px-1">Git</span>
            <span className="text-xs bg-gray-100 border border-gray-400 px-1">UI/UX Design</span>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-600 mt-4 pt-2 border-t border-gray-400">
        <p>References available upon request</p>
      </div>
    </div>
  )
}
