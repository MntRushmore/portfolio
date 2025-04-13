export default function ProjectsApp() {
  return (
    <div className="p-2 font-['MS_Sans_Serif',sans-serif] space-y-3 bg-white border border-gray-400 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">My Projects</h1>
        <div className="text-xs">6 items</div>
      </div>

      <div className="flex border-b border-gray-400 pb-1">
        <button className="px-2 py-0.5 border border-gray-400 bg-gray-200 text-xs mr-1">Details</button>
        <button className="px-2 py-0.5 border border-gray-400 bg-gray-200 text-xs mr-1">Icons</button>
        <button className="px-2 py-0.5 border border-gray-400 bg-gray-200 text-xs">List</button>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <ProjectItem
          title="E-Commerce Platform"
          icon="🛒"
          description="A full-featured online store with product management, cart functionality, and payment processing."
          date="Modified: 06/15/2023"
          size="4.2 MB"
          type="Web Application"
        />

        <ProjectItem
          title="Task Management App"
          icon="✓"
          description="A productivity app for managing tasks, projects, and deadlines with team collaboration features."
          date="Modified: 04/22/2023"
          size="3.8 MB"
          type="Web Application"
        />

        <ProjectItem
          title="Weather Dashboard"
          icon="☁️"
          description="A weather dashboard that displays current conditions and forecasts for multiple locations."
          date="Modified: 02/10/2023"
          size="2.1 MB"
          type="Web Application"
        />

        <ProjectItem
          title="Portfolio Website"
          icon="🌐"
          description="A personal portfolio website showcasing projects and skills."
          date="Modified: 01/05/2023"
          size="5.6 MB"
          type="Website"
        />

        <ProjectItem
          title="Mobile Fitness App"
          icon="💪"
          description="A fitness tracking app for iOS and Android with workout plans and progress tracking."
          date="Modified: 11/30/2022"
          size="8.3 MB"
          type="Mobile Application"
        />

        <ProjectItem
          title="AI Image Generator"
          icon="🎨"
          description="An application that generates images based on text prompts using AI."
          date="Modified: 09/18/2022"
          size="12.7 MB"
          type="Web Application"
        />
      </div>

      <div className="text-xs text-gray-600 border-t border-gray-400 pt-1">
        <p>6 items selected. 36.7 MB total size.</p>
      </div>
    </div>
  )
}

interface ProjectItemProps {
  title: string
  icon: string
  description: string
  date: string
  size: string
  type: string
}

function ProjectItem({ title, icon, description, date, size, type }: ProjectItemProps) {
  return (
    <div className="border border-gray-400 p-2 hover:bg-blue-100 cursor-pointer">
      <div className="flex items-start">
        <div className="text-2xl mr-2">{icon}</div>
        <div className="flex-1">
          <h3 className="font-bold text-sm">{title}</h3>
          <p className="text-xs text-gray-700 mt-1">{description}</p>
          <div className="flex justify-between text-xs text-gray-600 mt-2">
            <span>{date}</span>
            <span>{size}</span>
            <span>{type}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
