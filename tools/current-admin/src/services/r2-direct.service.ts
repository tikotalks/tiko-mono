// Alternative R2 service using direct fetch instead of AWS SDK
export class R2DirectService {
  private baseUrl: string

  constructor() {
    // Try using your custom domain directly
    this.baseUrl = 'https://media.tikocdn.org'
  }

  async uploadImage(file: File, path: string): Promise<{ key: string; url: string }> {
    const key = `${path}/${Date.now()}-${file.name}`
    const url = `${this.baseUrl}/${key}`

    try {
      // Direct PUT request to your custom domain
      const response = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        }
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
      }

      return { key, url }
    } catch (error) {
      console.error('Direct upload failed:', error)
      throw error
    }
  }
}