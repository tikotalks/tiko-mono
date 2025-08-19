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

export interface AnimationObject {
  id: string
  image: ImageAsset
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
  private animationId: number | null = null
  private lastTime = 0
  private backgroundColor: string

  // Viewport-relative units (0-100)
  public vw: number
  public vh: number
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
      debug: false
    }

    this.objects.set(id, obj)
    return obj
  }

  getObject(id: string): AnimationObject | undefined {
    return this.objects.get(id)
  }

  removeObject(id: string): void {
    this.objects.delete(id)
    this.animations.delete(id)
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
    if (!obj.image.loaded || !obj.image.image) return

    this.ctx.save()

    // Apply transformations
    this.ctx.globalAlpha = obj.opacity
    this.ctx.translate(obj.x + obj.width / 2, obj.y + obj.height / 2)
    this.ctx.rotate(obj.rotation * Math.PI / 180)
    this.ctx.scale(obj.scaleX, obj.scaleY)

    // Draw image
    this.ctx.drawImage(
      obj.image.image,
      -obj.width / 2,
      -obj.height / 2,
      obj.width,
      obj.height
    )

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

    // Draw all objects
    for (const obj of this.objects.values()) {
      if (obj.id === 'spaceship' && this.lastTime % 1000 < 16) { // Log once per second
        console.log('[CanvasAnimation] Drawing spaceship at', obj.x, obj.y, 'visible:', obj.visible, 'opacity:', obj.opacity)
      }
      this.drawObject(obj)
    }

    this.lastTime = currentTime
  }

  // Control methods
  start(): void {
    if (this.animationId !== null) return

    const animate = (currentTime: number) => {
      this.render(currentTime)
      this.animationId = requestAnimationFrame(animate)
    }

    this.animationId = requestAnimationFrame(animate)
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
  }

  // Getters
  getCanvas(): HTMLCanvasElement {
    return this.canvas
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx
  }
  
  getImage(id: string): ImageAsset | undefined {
    return this.images.get(id)
  }
  
  // Debug helper to get all objects
  getAllObjects(): Map<string, AnimationObject> {
    return this.objects
  }
}