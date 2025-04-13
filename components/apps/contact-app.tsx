export default function ContactApp() {
  return (
    <div className="p-2 font-['MS_Sans_Serif',sans-serif] space-y-3 bg-white border border-gray-400 h-full overflow-auto">
      <div className="text-center">
        <h1 className="text-xl font-bold">Contact Me</h1>
        <p className="text-xs text-gray-600">Please fill out this form to get in touch</p>
      </div>

      <div className="border border-gray-400 p-2 bg-black text-white">
        <form className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-bold block">Your Name:</label>
            <input
              type="text"
              className="w-full border-2 border-gray-400 px-2 py-1 text-sm focus:border-blue-800 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold block">Email Address:</label>
            <input
              type="email"
              className="w-full border-2 border-gray-400 px-2 py-1 text-sm focus:border-blue-800 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold block">Subject:</label>
            <select className="w-full border-2 border-gray-400 px-2 py-1 text-sm bg-white">
              <option>General Inquiry</option>
              <option>Job Opportunity</option>
              <option>Project Collaboration</option>
              <option>Other</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold block">Message:</label>
            <textarea
              rows={4}
              className="w-full border-2 border-gray-400 px-2 py-1 text-sm focus:border-blue-800 outline-none resize-none"
            ></textarea>
          </div>

          <div className="flex justify-center gap-2">
            <button
              type="submit"
              className="px-4 py-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-gray-700 border-b-gray-700 active:border-t-gray-700 active:border-l-gray-700 active:border-r-white active:border-b-white"
            >
              Send
            </button>
            <button
              type="reset"
              className="px-4 py-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-gray-700 border-b-gray-700 active:border-t-gray-700 active:border-l-gray-700 active:border-r-white active:border-b-white"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      <div className="border border-gray-400 p-2 bg-gray-100">
        <h2 className="text-sm font-bold underline">Other Ways to Reach Me:</h2>
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">📧</span>
            <span className="text-sm">rushilchopra@gmail.com</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📍</span>
            <span className="text-sm">San Francisco, CA</span>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-600 mt-4">
        <p>I'll respond to your message within 24-48 hours</p>
      </div>
    </div>
  )
}
