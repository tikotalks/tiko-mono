/**
 * Generate a color based on the image URL hash
 * Since we can't access the image pixels due to CORS, we'll generate
 * a consistent color based on the URL
 */
function generateColorFromUrl(url: string): string {
  let hash = 0
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Generate HSL color with good saturation and medium lightness
  const hue = Math.abs(hash % 360)
  const saturation = 25 + (Math.abs(hash >> 8) % 30) // 25-55%
  const lightness = 25 + (Math.abs(hash >> 16) % 20) // 25-45%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

/**
 * Get a color for the image background
 * Uses a hash-based approach to avoid CORS issues
 */
export async function getAverageColor(imageUrl: string): Promise<string> {
  // For Supabase URLs, we could potentially use their transformation API
  // but for now, let's use a deterministic color generation
  return Promise.resolve(generateColorFromUrl(imageUrl))
}

/**
 * Get a cached average color or calculate it
 */
const colorCache = new Map<string, string>()

export async function getCachedAverageColor(imageUrl: string): Promise<string> {
  if (colorCache.has(imageUrl)) {
    return colorCache.get(imageUrl)!
  }
  
  const color = await getAverageColor(imageUrl)
  colorCache.set(imageUrl, color)
  return color
}