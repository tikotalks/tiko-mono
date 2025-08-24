# Media Upload Worker

This Cloudflare Worker handles media file uploads with automatic AI-powered analysis for images and video thumbnails.

## Features

- Upload images and videos to Cloudflare R2
- Automatic image analysis using OpenAI Vision API
- Support for video thumbnails
- Metadata extraction and storage

## Video Upload with Thumbnails

When uploading videos, you should extract a thumbnail on the client side and include it in the upload. Here's how:

### Client-Side Video Thumbnail Extraction

```typescript
async function extractVideoThumbnail(videoFile: File): Promise<{ 
  thumbnail: Blob | null; 
  duration: number; 
  width: number; 
  height: number;
}> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.addEventListener('loadedmetadata', () => {
      // Seek to 1 second or 10% of video duration (whichever is smaller)
      const seekTime = Math.min(1, video.duration * 0.1);
      video.currentTime = seekTime;
    });
    
    video.addEventListener('seeked', () => {
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current frame to canvas
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob
      canvas.toBlob((blob) => {
        resolve({
          thumbnail: blob,
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight
        });
        
        // Clean up
        URL.revokeObjectURL(video.src);
      }, 'image/jpeg', 0.8);
    });
    
    video.addEventListener('error', () => {
      resolve({ 
        thumbnail: null, 
        duration: 0, 
        width: 0, 
        height: 0 
      });
      URL.revokeObjectURL(video.src);
    });
    
    // Create object URL and load video
    video.src = URL.createObjectURL(videoFile);
    video.load();
  });
}

// Usage example
async function uploadVideo(videoFile: File) {
  const { thumbnail, duration, width, height } = await extractVideoThumbnail(videoFile);
  
  const formData = new FormData();
  formData.append('file', videoFile);
  
  if (thumbnail) {
    formData.append('thumbnail', thumbnail, 'thumbnail.jpg');
  }
  formData.append('duration', duration.toString());
  formData.append('width', width.toString());
  formData.append('height', height.toString());
  
  const response = await fetch('https://your-worker-url/upload', {
    method: 'POST',
    body: formData
  });
  
  return response.json();
}
```

## API Endpoints

### POST /upload

Upload a file with optional metadata.

**Form Data:**
- `file` (required): The file to upload
- `thumbnail` (optional): Video thumbnail image
- `duration` (optional): Video duration in seconds
- `width` (optional): Video width in pixels
- `height` (optional): Video height in pixels

**Response:**
```json
{
  "success": true,
  "filename": "uploads/1234567890-video.mp4",
  "url": "https://data.tikocdn.org/uploads/1234567890-video.mp4",
  "thumbnail": "https://data.tikocdn.org/uploads/thumbnails/1234567890-video-thumb.jpg",
  "thumbnailUrl": "https://data.tikocdn.org/uploads/thumbnails/1234567890-video-thumb.jpg",
  "size": 10485760,
  "type": "video/mp4",
  "duration": 120,
  "width": 1920,
  "height": 1080,
  "title": "Video",
  "description": "AI-generated description",
  "tags": ["tag1", "tag2"],
  "categories": ["category1"]
}
```

### POST /analyze

Analyze an existing image URL.

**Request Body:**
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "title": "Optional title for context"
}
```

## Environment Variables

- `R2_BUCKET`: Cloudflare R2 bucket binding
- `OPENAI_API_KEY`: OpenAI API key for Vision analysis

## Deployment

Deploy using Wrangler:

```bash
cd workers/media-upload
npm install
npm run deploy
```