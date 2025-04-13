import type { ReactNode } from "react"

export interface AppSize {
  width: number
  height: number
}

export interface AppPosition {
  x: number
  y: number
}

export interface App {
  id: string
  title: string
  icon: ReactNode
  content: ReactNode
  defaultSize?: AppSize
}

export interface AppWindow {
  id: string
  appId: string
  title: string
  icon: ReactNode
  content: ReactNode
  position: AppPosition
  size: AppSize
  isMinimized: boolean
}
