import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

interface R2Config {
  accessKeyId: string
  secretAccessKey: string
  endpoint: string
  bucketName: string
  publicUrl: string
}

interface UploadOptions {
  contentType?: string
  metadata?: Record<string, string>
  cacheControl?: string
}

interface ImageVariant {
  name: string
  width: number
  height?: number
  quality?: number
}

class R2Service {
  private client: S3Client
  private config: R2Config

  constructor() {
    this.config = {
      accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID || '',
      secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY || '',
      endpoint: import.meta.env.VITE_R2_ENDPOINT || '',
      bucketName: import.meta.env.VITE_R2_BUCKET_NAME || 'media',
      publicUrl: import.meta.env.VITE_R2_PUBLIC_URL || ''
    }

    console.log('[R2Service] Config:', {
      hasAccessKey: !!this.config.accessKeyId,
      hasSecretKey: !!this.config.secretAccessKey,
      endpoint: this.config.endpoint,
      bucket: this.config.bucketName,
      publicUrl: this.config.publicUrl
    })

    if (!this.config.accessKeyId || !this.config.secretAccessKey) {
      console.error('[R2Service] Missing R2 credentials. Check your .env file.')
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint: this.config.endpoint,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey
      },
      // Force path-style URLs for R2
      forcePathStyle: true,
      // Disable bucket endpoint for R2 compatibility
      disableHostPrefix: true
    })
  }

  async uploadImage(
    file: File,
    path: string,
    options: UploadOptions = {}
  ): Promise<{ key: string; url: string }> {
    const key = `${path}/${file.name}`
    
    console.log('[R2Service] Uploading image:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      key,
      bucket: this.config.bucketName
    })
    
    try {
      // Convert File to ArrayBuffer for S3 SDK
      const arrayBuffer = await file.arrayBuffer()
      
      const command = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
        Body: new Uint8Array(arrayBuffer),
        ContentType: options.contentType || file.type,
        ContentLength: file.size,
        CacheControl: options.cacheControl || 'public, max-age=31536000',
        Metadata: options.metadata
      })

      const response = await this.client.send(command)
      console.log('[R2Service] Upload successful:', response)

      return {
        key,
        url: `${this.config.publicUrl}/${key}`
      }
    } catch (error) {
      console.error('[R2Service] Upload failed:', error)
      throw error
    }
  }

  async uploadImageWithVariants(
    file: File,
    basePath: string,
    variants: ImageVariant[]
  ): Promise<{ original: string; variants: Record<string, string> }> {
    // Upload original
    const originalResult = await this.uploadImage(file, `${basePath}/original`)
    
    // In a real implementation, you would process the image to create variants
    // For now, we'll just return the original URL for all variants
    const variantUrls: Record<string, string> = {}
    
    for (const variant of variants) {
      // TODO: Implement actual image processing
      // This would use a library like sharp to resize/optimize
      variantUrls[variant.name] = originalResult.url
    }

    return {
      original: originalResult.url,
      variants: variantUrls
    }
  }

  async listImages(prefix?: string): Promise<Array<{ key: string; url: string; size: number; lastModified: Date }>> {
    const command = new ListObjectsV2Command({
      Bucket: this.config.bucketName,
      Prefix: prefix
    })

    const response = await this.client.send(command)
    
    return (response.Contents || []).map(item => ({
      key: item.Key || '',
      url: `${this.config.publicUrl}/${item.Key}`,
      size: item.Size || 0,
      lastModified: item.LastModified || new Date()
    }))
  }

  async deleteImage(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.config.bucketName,
      Key: key
    })

    await this.client.send(command)
  }

  async getSignedUploadUrl(key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
      ContentType: contentType
    })

    return await getSignedUrl(this.client, command, { expiresIn: 3600 })
  }

  getPublicUrl(key: string): string {
    return `${this.config.publicUrl}/${key}`
  }
}

export const r2Service = new R2Service()
export type { R2Config, UploadOptions, ImageVariant }