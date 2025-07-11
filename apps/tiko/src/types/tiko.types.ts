export interface TikoApp {
  id: string
  name: string
  description: string
  icon: string
  iconImage?: string
  color: string
  url?: string
  installed: boolean
  storeUrl?: string
  order: number
}