export interface TAvatarProps {
  src?: string
  alt?: string
  name?: string
  email?: string
  color?: string
  size?: 'small' | 'medium' | 'large'
  showOnlineStatus?: boolean
  isOnline?: boolean
}