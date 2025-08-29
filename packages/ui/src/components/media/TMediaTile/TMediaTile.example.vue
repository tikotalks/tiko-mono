<template>
  <div class="media-tile-example">
    <h2>TMediaTile Video Example</h2>

    <!-- Grid of media tiles -->
    <div class="media-grid">
      <TMediaTile
        v-for="item in mediaItems"
        :key="item.id"
        :media="item"
        @click="handleMediaClick"
        @video-play="handleVideoPlay"
      />
    </div>

    <!-- Video Player Modal -->
    <div v-if="playingVideo" class="video-modal" @click="closeVideo">
      <div class="video-modal-content" @click.stop>
        <video
          :src="playingVideo.original_url"
          controls
          autoplay
          @ended="closeVideo"
        />
        <button class="close-button" @click="closeVideo">×</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TMediaTile from './TMediaTile.vue';
import type { MediaItem } from './TMediaTile.model';

// Example media items
const mediaItems = ref<MediaItem[]>([
  {
    id: '1',
    title: 'Sample Video',
    original_filename: 'video.mp4',
    original_url: 'https://example.com/video.mp4',
    thumbnail_url: 'https://example.com/video-thumb.jpg',
    file_size: 1024000,
    type: 'video/mp4',
    duration: 125, // 2:05
  },
  {
    id: '2',
    title: 'Another Video',
    original_filename: 'video2.mp4',
    original_url: 'https://example.com/video2.mp4',
    // No thumbnail - will show placeholder
    file_size: 2048000,
    type: 'video/mp4',
    duration: 45, // 0:45
  },
  {
    id: '3',
    title: 'Audio File',
    original_filename: 'audio.mp3',
    original_url: 'https://example.com/audio.mp3',
    file_size: 512000,
    type: 'audio/mp3',
    duration: 180, // 3:00
  },
  {
    id: '4',
    title: 'Image File',
    original_filename: 'image.jpg',
    original_url: 'https://example.com/image.jpg',
    file_size: 256000,
    type: 'image/jpeg',
  },
]);

const playingVideo = ref<MediaItem | null>(null);

const handleMediaClick = (event: Event, media?: MediaItem) => {
  console.log('Media clicked:', media);
};

const handleVideoPlay = (media: MediaItem) => {
  console.log('Play video:', media);
  playingVideo.value = media;
};

const closeVideo = () => {
  playingVideo.value = null;
};
</script>

<style>
.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

.video-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.video-modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.video-modal-content video {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 90vh;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  font-size: 2rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  background: rgba(0, 0, 0, 0.8);
}
</style>
