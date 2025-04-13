"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"

export default function TerminalApp() {
  const [input, setInput] = useState("")
  const [history, setHistory] = useState<string[]>(["NotionOS Terminal", "Version 1.0.0", "", "user@portfolio:~$"])
  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Focus input when terminal is opened
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  useEffect(() => {
    // Scroll to bottom when history changes
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [history])

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) {
      setHistory([...history, "user@portfolio:~$"])
      return
    }

    const newHistory = [...history, `user@portfolio:~$ ${input}`]
    const command = input.trim().toLowerCase()

    if (command === "help") {
      newHistory.push(
        "Available commands:",
        "  help      - Shows this help message",
        "  ls        - Lists files in current directory",
        "  about     - Display information about me",
        "  skills    - List my technical skills",
        "  projects  - Show my recent projects",
        "  contact     - Display contact information",
        "  clear     - Clear the screen",
        "  date      - Show current date and time",
        "  version   - Show system version",
        "  exit      - Close this window",
        "",
        "user@portfolio:~$",
      )
    } else if (command === "ls") {
      newHistory.push(
        "about.txt",
        "projects/",
        "resume.pdf",
        "contact.md",
        "skills.json",
        "gallery/",
        "",
        "user@portfolio:~$",
      )
    } else if (command === "about") {
      newHistory.push(
        "# About Me",
        "",
        "I'm a web developer and designer with a passion for creating",
        "beautiful, functional, and user-friendly websites and applications.",
        "",
        "When I'm not coding, I enjoy hiking, reading, and photography.",
        "",
        "user@portfolio:~$",
      )
    } else if (command === "skills") {
      newHistory.push(
        "{",
        '  "frontend": ["HTML", "CSS", "JavaScript", "React", "Next.js"],',
        '  "backend": ["Node.js", "Express", "MongoDB"],',
        '  "tools": ["Git", "VS Code", "Figma"],',
        '  "other": ["Responsive Design", "UI/UX", "SEO"]',
        "}",
        "",
        "user@portfolio:~$",
      )
    } else if (command === "projects") {
      newHistory.push(
        "# Recent Projects",
        "",
        "- E-Commerce Platform",
        "- Task Management App",
        "- Weather Dashboard",
        "- Portfolio Website",
        "- Mobile Fitness App",
        "- AI Image Generator",
        "",
        "user@portfolio:~$",
      )
    } else if (command === "contact") {
      newHistory.push(
        "# Contact Information",
        "",
        "Email: email@example.com",
        "Phone: (123) 456-7890",
        "Location: San Francisco, CA",
        "",
        "user@portfolio:~$",
      )
    } else if (command === "clear") {
      setHistory(["user@portfolio:~$"])
      setInput("")
      return
    } else if (command === "date") {
      const now = new Date()
      newHistory.push(`${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, "", "user@portfolio:~$")
    } else if (command === "version") {
      newHistory.push("NotionOS Terminal v1.0.0", "© 2023 Your Name. All rights reserved.", "", "user@portfolio:~$")
    } else if (command === "exit") {
      newHistory.push("Closing terminal...")
      setHistory(newHistory)
      // This would close the window in a real implementation
      return
    } else {
      newHistory.push(
        `Command not found: ${command}`,
        "Type 'help' for a list of available commands.",
        "",
        "user@portfolio:~$",
      )
    }

    setHistory(newHistory)
    setInput("")
  }

  return (
    <div className="h-full flex flex-col bg-black text-white font-mono text-sm overflow-hidden terminal">
      <div className="flex-1 p-4 overflow-auto" ref={terminalRef}>
        {history.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap">
            {line}
          </div>
        ))}
      </div>

      <form onSubmit={handleCommand} className="flex items-center p-4 border-t border-gray-800">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full bg-black text-white border-none outline-none"
          autoComplete="off"
          spellCheck="false"
        />
      </form>
    </div>
  )
}
