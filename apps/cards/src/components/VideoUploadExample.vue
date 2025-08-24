<template>
  <div class="video-upload-example">
    <h3>Video Upload Example</h3>
    
    <input 
      type="file" 
      accept="video/*" 
      @change="handleFileSelect"
      :disabled="isUploading"
    />
    
    <div v-if="thumbnailPreview" class="preview">
      <h4>Extracted Thumbnail:</h4>
      <img :src="thumbnailPreview" alt="Video thumbnail" />
      <p>Duration: {{ videoDuration }}s</p>
      <p>Size: {{ videoWidth }}x{{ videoHeight }}</p>
    </div>
    
    <button 
      v-if="selectedFile && thumbnailBlob"
      @click="uploadVideo"
      :disabled="isUploading"
    >
      {{ isUploading ? 'Uploading...' : 'Upload Video' }}
    </button>
    
    <div v-if="uploadResult" class="result">
      <h4>Upload Result:</h4>
      <pre>{{ JSON.stringify(uploadResult, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const selectedFile = ref<File | null>(null);
const thumbnailBlob = ref<Blob | null>(null);
const thumbnailPreview = ref<string>('');
const videoDuration = ref(0);
const videoWidth = ref(0);
const videoHeight = ref(0);
const isUploading = ref(false);
const uploadResult = ref<any>(null);

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
      // Set canvas size to match video (max 1920px wide for reasonable thumbnail size)
      const maxWidth = 1920;
      const scale = video.videoWidth > maxWidth ? maxWidth / video.videoWidth : 1;
      
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;
      
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

async function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  
  if (!file || !file.type.startsWith('video/')) {
    alert('Please select a video file');
    return;
  }
  
  selectedFile.value = file;
  uploadResult.value = null;
  
  // Extract thumbnail
  const { thumbnail, duration, width, height } = await extractVideoThumbnail(file);
  
  if (thumbnail) {
    thumbnailBlob.value = thumbnail;
    videoDuration.value = duration;
    videoWidth.value = width;
    videoHeight.value = height;
    
    // Create preview URL
    thumbnailPreview.value = URL.createObjectURL(thumbnail);
  }
}

async function uploadVideo() {
  if (!selectedFile.value || !thumbnailBlob.value) return;
  
  isUploading.value = true;
  
  try {
    const formData = new FormData();
    formData.append('file', selectedFile.value);
    formData.append('thumbnail', thumbnailBlob.value, 'thumbnail.jpg');
    formData.append('duration', videoDuration.value.toString());
    formData.append('width', videoWidth.value.toString());
    formData.append('height', videoHeight.value.toString());
    
    // Replace with your actual worker URL
    const workerUrl = import.meta.env.VITE_MEDIA_UPLOAD_WORKER_URL || 'https://media-upload.tikoapi.org';
    
    const response = await fetch(`${workerUrl}/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    uploadResult.value = await response.json();
  } catch (error) {
    console.error('Upload error:', error);
    alert('Upload failed: ' + (error as Error).message);
  } finally {
    isUploading.value = false;
  }
}
</script>

<style scoped>
.video-upload-example {
  padding: 1rem;
  max-width: 600px;
}

.preview {
  margin: 1rem 0;
}

.preview img {
  max-width: 300px;
  height: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.result {
  margin-top: 1rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.result pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

button {
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

input[type="file"] {
  margin-bottom: 1rem;
}
</style>