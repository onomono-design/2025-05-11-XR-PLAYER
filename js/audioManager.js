import { audio_src, thumbnail_src, chapterName, chapterOrder, tourName } from './config.js';
import { $ } from './utils.js';
import { setAudioReady, setVideoReady, getXRMode, handleCTAOverlay } from './uiController.js';
import { setupSyncInterval } from './videoManager.js';

// Initialize audio player
const initAudio = () => {
  const audio = $('audioPlayer');
  const art = $('artworkImg');
  const track = $('trackInfo');
  
  audio.innerHTML = `<source src="${audio_src}" type="audio/mpeg">`;
  // Apply custom controls to audio element
  audio.controlsList = "nodownload nofullscreen noremoteplayback";
  
  art.src = thumbnail_src;
  track.textContent = `Chapter ${chapterOrder} – ${chapterName} | ${tourName}`;
  
  // Handle CTA overlay during playback
  handleCTAOverlay(audio);
  
  return audio;
};

// Setup audio event listeners
const setupAudioEvents = (audio, video) => {
  let syncInterval = null;
  
  // Load event
  audio.addEventListener('loadeddata', () => {
    console.log("Audio loaded");
    setAudioReady(true);
  });
  
  // Play event
  audio.addEventListener('play', () => {
    const xrMode = getXRMode();
    
    if (xrMode && video && !video.paused) {
      video.muted = true;
      video.currentTime = audio.currentTime;
      video.play().catch(e => {
        console.error("Video play error:", e);
      });
    }
    
    // Set up sync interval when playback starts
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = setupSyncInterval(video, audio, true, xrMode);
  });
  
  // Pause event
  audio.addEventListener('pause', () => {
    if (video && !video.paused) video.pause();
  });
  
  return syncInterval;
};

export {
  initAudio,
  setupAudioEvents
}; 