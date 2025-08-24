export interface CanvasAnimationOptions {
  container?: HTMLElement
  width?: number
  height?: number
  fillViewport?: boolean
  backgroundColor?: string
}

export interface ImageAsset {
  id: string
  src: string
  image?: HTMLImageElement
  loaded?: boolean
}

export interface VideoAsset {
  id: string
  src: string
  video?: HTMLVideoElement
  loaded?: boolean
  duration?: number
  playbackMode?: 'once' | 'loop' | 'stretch'
  stretchDuration?: number // Duration to stretch the video over (in ms)
}

export interface AnimationObject {
  id: string
  image?: ImageAsset
  video?: VideoAsset
  x: number
  y: number
  width: number
  height: number
  rotation: number
  scaleX: number
  scaleY: number
  opacity: number
  visible: boolean
  debug?: boolean
  zIndex?: number // Add z-index for layering
}

export interface AnimationStep {
  duration: number
  easing?: (t: number) => number
  properties: Partial<Pick<AnimationObject, 'x' | 'y' | 'width' | 'height' | 'rotation' | 'scaleX' | 'scaleY' | 'opacity'>>
}

export interface AnimationSequence {
  object: AnimationObject
  steps: AnimationStep[]
  currentStep: number
  startTime: number
  onComplete?: () => void
}

export class CanvasAnimation {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private objects: Map<string, AnimationObject> = new Map()
  private animations: Map<string, AnimationSequence> = new Map()
  private images: Map<string, ImageAsset> = new Map()
  private videos: Map<string, VideoAsset> = new Map()
  private animationId: number | null = null
  private lastTime = 0
  private backgroundColor: string
  private animationStartTime = 0

  // Viewport-relative units (0-100)
  public vw: number = 0
  public vh: number = 0
  // Logical dimensions (CSS pixels, not physical pixels)
  public logicalWidth: number = 0
  public logicalHeight: number = 0

  constructor(options: CanvasAnimationOptions = {}) {
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')!
    this.backgroundColor = options.backgroundColor || 'transparent'

    if (options.container) {
      options.container.appendChild(this.canvas)
    }

    this.setupCanvas(options)
    this.updateViewportUnits()
    this.bindEvents()
  }

  private setupCanvas(options: CanvasAnimationOptions) {
    if (options.fillViewport) {
      this.canvas.style.position = 'fixed'
      this.canvas.style.top = '0'
      this.canvas.style.left = '0'
      this.canvas.style.width = '100vw'
      this.canvas.style.height = '100vh'
      this.canvas.style.zIndex = '1000'
      // Initialize logical dimensions BEFORE resizing
      this.logicalWidth = window.innerWidth
      this.logicalHeight = window.innerHeight
      this.resizeToViewport()
    } else {
      this.logicalWidth = options.width || 800
      this.logicalHeight = options.height || 600
      this.canvas.width = this.logicalWidth
      this.canvas.height = this.logicalHeight
    }
  }

  private updateViewportUnits() {
    // Use logical dimensions for viewport units, not physical pixels!
    this.vw = this.logicalWidth / 100
    this.vh = this.logicalHeight / 100
  }

  private bindEvents() {
    if (this.canvas.style.position === 'fixed') {
      window.addEventListener('resize', () => {
        this.resizeToViewport()
        this.updateViewportUnits()
      })
    }
  }

  private resizeToViewport() {
    const dpr = window.devicePixelRatio || 1
    // Store logical dimensions
    this.logicalWidth = window.innerWidth
    this.logicalHeight = window.innerHeight
    // Set physical dimensions
    this.canvas.width = window.innerWidth * dpr
    this.canvas.height = window.innerHeight * dpr
    this.ctx.scale(dpr, dpr)
    this.canvas.style.width = window.innerWidth + 'px'
    this.canvas.style.height = window.innerHeight + 'px'
  }

  // Image loading methods
  async loadImage(id: string, src: string): Promise<ImageAsset> {
    return new Promise((resolve, reject) => {
      const image = new Image()
      const asset: ImageAsset = { id, src, image, loaded: false }
      
      image.onload = () => {
        asset.loaded = true
        this.images.set(id, asset)
        resolve(asset)
      }
      
      image.onerror = () => {
        reject(new Error(`Failed to load image: ${src}`))
      }
      
      image.src = src
    })
  }

  async loadImages(assets: Array<{id: string, src: string}>): Promise<ImageAsset[]> {
    return Promise.all(assets.map(asset => this.loadImage(asset.id, asset.src)))
  }

  // Video loading methods
  async loadVideo(id: string, src: string, playbackMode: 'once' | 'loop' | 'stretch' = 'loop', stretchDuration?: number): Promise<VideoAsset> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const asset: VideoAsset = { id, src, video, loaded: false, playbackMode, stretchDuration }
      
      video.onloadedmetadata = () => {
        asset.duration = video.duration * 1000 // Convert to milliseconds
        asset.loaded = true
        this.videos.set(id, asset)
        
        // Set up video element for proper playback
        video.style.display = 'none'
        video.setAttribute('playsinline', 'true')
        video.setAttribute('webkit-playsinline', 'true')
        video.setAttribute('preload', 'auto')
        
        // Append to DOM for better compatibility
        document.body.appendChild(video)
        
        // Set up video based on playback mode
        if (playbackMode === 'loop') {
          video.loop = true
        } else if (playbackMode === 'stretch' && stretchDuration) {
          // Calculate playback rate to stretch video over desired duration
          // If video is 5 seconds and we want it to last 10 seconds, rate should be 0.5
          const playbackRate = (video.duration * 1000) / stretchDuration
          video.playbackRate = playbackRate
          video.loop = false // Don't loop when stretching
        }
        
        // Start playing the video
        video.play().catch(err => console.warn('Video autoplay failed:', err))
        
        resolve(asset)
      }
      
      video.onerror = () => {
        // Try again without CORS
        const video2 = document.createElement('video')
        
        video2.onloadedmetadata = () => {
          const asset: VideoAsset = {
            id,
            src,
            video: video2,
            loaded: true,
            duration: video2.duration,
            playbackMode,
            stretchDuration
          }
          
          this.videos.set(id, asset)
          
          if (playbackMode === 'loop') {
            video2.loop = true
          }
          
          // Start playing the video
          video2.play().catch(err => console.warn('Video autoplay failed:', err))
          
          resolve(asset)
        }
        
        video2.onerror = () => {
          reject(new Error(`Failed to load video: ${src}`))
        }
        
        // Set video properties WITHOUT CORS this time
        video2.src = src
        video2.muted = true
        video2.playsInline = true
        // NO crossOrigin attribute
      }
      
      // Set video properties WITH CORS for first attempt
      video.src = src
      video.muted = true // Mute to allow autoplay
      video.playsInline = true // Important for mobile
      video.crossOrigin = 'anonymous' // Allow cross-origin videos
    })
  }

  async loadVideos(assets: Array<{id: string, src: string, playbackMode?: 'once' | 'loop' | 'stretch', stretchDuration?: number}>): Promise<VideoAsset[]> {
    return Promise.all(assets.map(asset => 
      this.loadVideo(asset.id, asset.src, asset.playbackMode || 'loop', asset.stretchDuration)
    ))
  }

  // Object creation and management
  createObject(id: string, imageId: string, x: number, y: number, width: number, height: number): AnimationObject {
    const image = this.images.get(imageId)
    if (!image) {
      throw new Error(`Image ${imageId} not found. Load it first with loadImage()`)
    }

    const obj: AnimationObject = {
      id,
      image,
      x,
      y,
      width,
      height,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      visible: true,
      debug: false,
      zIndex: 0
    }

    this.objects.set(id, obj)
    return obj
  }

  createVideoObject(id: string, videoId: string, x: number, y: number, width: number, height: number): AnimationObject {
    const video = this.videos.get(videoId)
    if (!video) {
      throw new Error(`Video ${videoId} not found. Load it first with loadVideo()`)
    }

    const obj: AnimationObject = {
      id,
      video,
      x,
      y,
      width,
      height,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      visible: true,
      debug: false,
      zIndex: 0
    }

    this.objects.set(id, obj)
    return obj
  }

  getObject(id: string): AnimationObject | undefined {
    return this.objects.get(id)
  }

  getAllObjects(): AnimationObject[] {
    return Array.from(this.objects.values())
  }

  getImage(id: string): ImageAsset | undefined {
    return this.images.get(id)
  }

  // Register a custom image (e.g., from a canvas element)
  registerCustomImage(id: string, imageSource: HTMLCanvasElement | HTMLImageElement): void {
    const asset: ImageAsset = {
      id,
      src: 'custom',
      image: imageSource as any, // Canvas elements can be drawn with drawImage too
      loaded: true
    }
    this.images.set(id, asset)
  }

  removeObject(id: string): void {
    this.objects.delete(id)
    this.animations.delete(id)
  }

  // Set z-index for an object
  setZIndex(id: string, zIndex: number): void {
    const obj = this.objects.get(id)
    if (obj) {
      obj.zIndex = zIndex
    }
  }

  // Animation methods
  animate(objectId: string, steps: AnimationStep[], onComplete?: () => void): void {
    const obj = this.objects.get(objectId)
    if (!obj) {
      throw new Error(`Object ${objectId} not found`)
    }

    const sequence: AnimationSequence = {
      object: obj,
      steps,
      currentStep: 0,
      startTime: performance.now(),
      onComplete
    }

    this.animations.set(objectId, sequence)
  }

  // Video control methods
  playVideo(videoId: string): void {
    const asset = this.videos.get(videoId)
    if (asset?.video) {
      asset.video.play().catch(err => console.warn('Video play failed:', err))
    }
  }

  pauseVideo(videoId: string): void {
    const asset = this.videos.get(videoId)
    if (asset?.video) {
      asset.video.pause()
    }
  }

  setVideoTime(videoId: string, time: number): void {
    const asset = this.videos.get(videoId)
    if (asset?.video) {
      asset.video.currentTime = time / 1000 // Convert ms to seconds
    }
  }

  setVideoPlaybackRate(videoId: string, rate: number): void {
    const asset = this.videos.get(videoId)
    if (asset?.video) {
      asset.video.playbackRate = rate
    }
  }

  getVideo(id: string): VideoAsset | undefined {
    return this.videos.get(id)
  }

  // Easing functions
  static easings = {
    linear: (t: number) => t,
    easeInQuad: (t: number) => t * t,
    easeOutQuad: (t: number) => t * (2 - t),
    easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: (t: number) => t * t * t,
    easeOutCubic: (t: number) => (--t) * t * t + 1,
    easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    // Custom bouncy easing similar to cubic-bezier(0,.5,.5,1.5)
    bouncy: (t: number) => {
      const c1 = 1.70158
      const c3 = c1 + 1
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
    },
    // Extra bouncy for wiggle effects
    extraBouncy: (t: number) => {
      const c1 = 2.5
      const c3 = c1 + 1
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
    }
  }

  // Utility methods for common positioning - USE LOGICAL DIMENSIONS
  centerX(width: number): number {
    return (this.logicalWidth - width) / 2
  }

  centerY(height: number): number {
    return (this.logicalHeight - height) / 2
  }

  // Convert viewport percentages to pixels - USE LOGICAL DIMENSIONS
  vwToPx(vw: number): number {
    return (vw / 100) * this.logicalWidth
  }

  vhToPx(vh: number): number {
    return (vh / 100) * this.logicalHeight
  }

  // Render methods
  private updateAnimations(currentTime: number): void {
    for (const [id, sequence] of this.animations.entries()) {
      if (sequence.currentStep >= sequence.steps.length) {
        // Animation complete
        this.animations.delete(id)
        sequence.onComplete?.()
        continue
      }

      const step = sequence.steps[sequence.currentStep]
      const elapsed = currentTime - sequence.startTime
      const progress = Math.min(elapsed / step.duration, 1)
      
      const easing = step.easing || CanvasAnimation.easings.linear
      const easedProgress = easing(progress)

      // Interpolate properties
      const startProps = this.getObjectStartProps(sequence.object, sequence.currentStep)
      for (const [key, endValue] of Object.entries(step.properties)) {
        const startValue = startProps[key as keyof typeof startProps]
        if (typeof startValue === 'number' && typeof endValue === 'number') {
          let newValue = startValue + (endValue - startValue) * easedProgress
          
          // Apply bounds checking for position properties if this is a spaceship
          if (sequence.object.id === 'spaceship' && (key === 'x' || key === 'y')) {
            const margin = 150 // Large margin to keep spaceship visible
            if (key === 'x') {
              newValue = Math.max(margin, Math.min(this.logicalWidth - sequence.object.width - margin, newValue))
            } else if (key === 'y') {
              newValue = Math.max(margin, Math.min(this.logicalHeight - sequence.object.height - margin, newValue))
            }
          }
          
          (sequence.object as any)[key] = newValue
        }
      }

      // Move to next step if current is complete
      if (progress >= 1) {
        sequence.currentStep++
        sequence.startTime = currentTime
      }
    }
  }

  private getObjectStartProps(obj: AnimationObject, stepIndex: number): Partial<AnimationObject> {
    if (stepIndex === 0) {
      return {
        x: obj.x,
        y: obj.y,
        width: obj.width,
        height: obj.height,
        rotation: obj.rotation,
        scaleX: obj.scaleX,
        scaleY: obj.scaleY,
        opacity: obj.opacity
      }
    }

    // Get the end state of the previous step
    const prevSteps = this.animations.get(obj.id)?.steps.slice(0, stepIndex)
    if (!prevSteps) return {}

    let result = { ...obj }
    for (const step of prevSteps) {
      Object.assign(result, step.properties)
    }

    return result
  }

  private drawObject(obj: AnimationObject): void {
    if (!obj.visible || obj.opacity <= 0) return
    
    // Check if object has an image or video
    const hasImage = obj.image && obj.image.loaded && obj.image.image
    const hasVideo = obj.video && obj.video.loaded && obj.video.video
    
    if (!hasImage && !hasVideo) {
      return
    }

    this.ctx.save()

    // Apply transformations
    this.ctx.globalAlpha = obj.opacity
    this.ctx.translate(obj.x + obj.width / 2, obj.y + obj.height / 2)
    this.ctx.rotate(obj.rotation * Math.PI / 180)
    this.ctx.scale(obj.scaleX, obj.scaleY)

    // Draw image or video
    if (hasVideo && obj.video?.video) {
      // Ensure video is playing
      if (obj.video.video.paused) {
        obj.video.video.play().catch(() => {})
      }
      
      this.ctx.drawImage(
        obj.video.video,
        -obj.width / 2,
        -obj.height / 2,
        obj.width,
        obj.height
      )
    } else if (hasImage && obj.image?.image) {
      this.ctx.drawImage(
        obj.image.image,
        -obj.width / 2,
        -obj.height / 2,
        obj.width,
        obj.height
      )
    }

    // Draw debug border if enabled
    if (obj.debug) {
      this.ctx.strokeStyle = obj.id.includes('fire') ? '#ff0000' : '#00ff00' // Red for fire, green for others
      this.ctx.lineWidth = 2
      this.ctx.strokeRect(-obj.width / 2, -obj.height / 2, obj.width, obj.height)
      
      // Draw object ID label
      this.ctx.fillStyle = obj.id.includes('fire') ? '#ff0000' : '#00ff00'
      this.ctx.font = '14px monospace'
      this.ctx.fillText(obj.id, -obj.width / 2, -obj.height / 2 - 5)
    }

    this.ctx.restore()
  }

  private render(currentTime: number): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight)
    
    // Draw background if specified
    if (this.backgroundColor !== 'transparent') {
      this.ctx.fillStyle = this.backgroundColor
      this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight)
    }

    // Update animations
    this.updateAnimations(currentTime)

    // Sort objects by z-index and draw them
    const sortedObjects = Array.from(this.objects.values()).sort((a, b) => {
      const aZ = a.zIndex ?? 0
      const bZ = b.zIndex ?? 0
      return aZ - bZ
    })

    // Draw all objects in z-index order
    for (const obj of sortedObjects) {
      this.drawObject(obj)
    }

    this.lastTime = currentTime
  }

  // Control methods
  start(): void {
    if (this.animationId !== null) return
    
    // Set animation start time for video stretching
    this.animationStartTime = performance.now()

    const animate = (currentTime: number) => {
      this.render(currentTime)
      this.animationId = requestAnimationFrame(animate)
    }

    this.animationId = requestAnimationFrame(animate)
  }

  setAnimationStartTime(time: number): void {
    this.animationStartTime = time
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  destroy(): void {
    this.stop()
    this.canvas.remove()
    this.objects.clear()
    this.animations.clear()
    this.images.clear()
    
    // Clean up video elements
    for (const videoAsset of this.videos.values()) {
      if (videoAsset.video) {
        videoAsset.video.pause()
        videoAsset.video.remove()
      }
    }
    this.videos.clear()
  }

  // Getters
  getCanvas(): HTMLCanvasElement {
    return this.canvas
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx
  }
}