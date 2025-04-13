export default function SocialApp() {
  return (
    <div className="p-2 font-['MS_Sans_Serif',sans-serif] space-y-3 bg-white border border-gray-400 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Internet</h1>
        <div className="flex gap-1">
          <button className="px-2 py-0.5 border border-gray-400 bg-gray-200 text-xs">Back</button>
          <button className="px-2 py-0.5 border border-gray-400 bg-gray-200 text-xs">Forward</button>
          <button className="px-2 py-0.5 border border-gray-400 bg-gray-200 text-xs">Refresh</button>
        </div>
      </div>

      <div className="border border-gray-400 p-1 bg-gray-100">
        <div className="flex items-center gap-1">
          <span className="text-xs">Address:</span>
          <input
            type="text"
            value="http://www.yourname.com/social"
            className="flex-1 border border-gray-400 px-1 py-0.5 text-xs"
            readOnly
          />
          <button className="px-2 py-0.5 border border-gray-400 bg-gray-200 text-xs">Go</button>
        </div>
      </div>

      <div className="border border-gray-400 p-2 bg-white">
        <h2 className="text-center text-lg font-bold">Connect With Me</h2>
        <p className="text-center text-xs">Find me on these platforms</p>

        <div className="grid grid-cols-1 gap-2 mt-3">
          <SocialLink name="GitHub" url="https://github.com/yourusername" icon="💻" username="@yourusername" />
          <SocialLink name="LinkedIn" url="https://linkedin.com/in/yourname" icon="💼" username="Your Name" />
          <SocialLink name="Twitter" url="https://twitter.com/yourusername" icon="🐦" username="@yourusername" />
          <SocialLink name="Instagram" url="https://instagram.com/yourusername" icon="📷" username="@yourusername" />
          <SocialLink name="YouTube" url="https://youtube.com/c/yourchannel" icon="📺" username="Your Channel" />
          <SocialLink name="Personal Website" url="https://yourwebsite.com" icon="🌐" username="yourwebsite.com" />
        </div>
      </div>

      <div className="text-center text-xs text-gray-600 mt-4">
        <p>Connection: 56K Modem</p>
        <p>Internet Explorer 3.0</p>
      </div>
    </div>
  )
}

interface SocialLinkProps {
  name: string
  url: string
  icon: string
  username: string
}

function SocialLink({ name, url, icon, username }: SocialLinkProps) {
  return (
    <div className="border border-gray-400 p-2 hover:bg-blue-100 cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <div>
            <div className="text-sm font-bold">{name}</div>
            <div className="text-xs">{username}</div>
          </div>
        </div>
        <span className="text-xs underline text-blue-800">Visit</span>
      </div>
    </div>
  )
}
