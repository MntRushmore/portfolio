import AboutApp from "@/components/apps/about-app"
import ProjectsApp from "@/components/apps/projects-app"
import ContactApp from "@/components/apps/contact-app"
import ResumeApp from "@/components/apps/resume-app"
import TerminalApp from "@/components/apps/terminal-app"
import GalleryApp from "@/components/apps/gallery-app"
import MusicApp from "@/components/apps/music-app"
import SettingsApp from "@/components/apps/settings-app"
import SocialApp from "@/components/apps/social-app"
import WelcomeApp from "@/components/apps/welcome-app"
import type { App } from "@/lib/types"

export const apps: App[] = [
  {
    id: "welcome",
    title: "Welcome",
    icon: <span className="text-lg">📝</span>,
    content: <WelcomeApp />,
    defaultSize: { width: 600, height: 450 },
  },
  {
    id: "about",
    title: "About Me",
    icon: <span className="text-lg">👤</span>,
    content: <AboutApp />,
    defaultSize: { width: 550, height: 500 },
  },
  {
    id: "projects",
    title: "My Projects",
    icon: <span className="text-lg">📁</span>,
    content: <ProjectsApp />,
    defaultSize: { width: 650, height: 500 },
  },
  {
    id: "contact",
    title: "Contact",
    icon: <span className="text-lg">📧</span>,
    content: <ContactApp />,
    defaultSize: { width: 500, height: 450 },
  },
  {
    id: "resume",
    title: "Resume",
    icon: <span className="text-lg">📄</span>,
    content: <ResumeApp />,
    defaultSize: { width: 650, height: 550 },
  },
  {
    id: "terminal",
    title: "Terminal",
    icon: <span className="text-lg">💻</span>,
    content: <TerminalApp />,
    defaultSize: { width: 600, height: 400 },
  },
  {
    id: "gallery",
    title: "Gallery",
    icon: <span className="text-lg">🖼️</span>,
    content: <GalleryApp />,
    defaultSize: { width: 700, height: 500 },
  },
  {
    id: "music",
    title: "Music",
    icon: <span className="text-lg">🎵</span>,
    content: <MusicApp />,
    defaultSize: { width: 450, height: 500 },
  },
  {
    id: "social",
    title: "Social",
    icon: <span className="text-lg">🌐</span>,
    content: <SocialApp />,
    defaultSize: { width: 550, height: 450 },
  },
  {
    id: "settings",
    title: "Settings",
    icon: <span className="text-lg">⚙️</span>,
    content: <SettingsApp />,
    defaultSize: { width: 550, height: 500 },
  },
]
