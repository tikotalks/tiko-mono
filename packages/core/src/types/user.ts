export interface User {
  id: string
  email?: string
  appleId?: string
  language: string
  createdAt: Date
  updatedAt: Date
}

export interface AppSettings {
  id: string
  userId: string
  appName: string
  settings: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface SyncAction {
  id: string
  type: string
  payload: any
  timestamp: Date
  synced: boolean
}