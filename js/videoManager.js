import { isMobile, PERFORMANCE } from './config.js';
import { $, showSpinner, hideSpinner } from './utils.js';

// Configure video quality for mobile devices
const configureVideoForDevice = () => {
  if (isMobile) {
    // Reduce video element size for mobile to improve performance
    const video = $('video360');
    if (video) {
      // Set maximum dimensions for mobile to help with performance
      video.style.maxWidth = `${Math.round(1280 * PERFORMANCE.videoScale)}px`;
      video.style.maxHeight = `${Math.round(720 * PERFORMANCE.videoScale)}px`;
      
      // For mobile, we can also set lower resolution on the video element directly
      // This forces a lower internal resolution in memory
      video.width = Math.round(1280 * PERFORMANCE.videoScale);
      video.height = Math.round(720 * PERFORMANCE.videoScale);
      
      // Set video quality and playback hints
      if ('playsInline' in video) video.playsInline = true;
      if ('webkitPlaysInline' in video) video.webkitPlaysInline = true;
      
      // Add explicit hints for memory-efficient video playback
      video.preload = "auto";
      
      // Signal to the browser this isn't a high-quality video playback
      if ('preservesPitch' in video) video.preservesPitch = false;
      
      // Adjust buffering strategy - this is key for mobile performance
      try {
        // Most browsers support this, but wrap in try/catch for safety
        video.preload = "auto"; // Ensure preloading is enabled
      } catch (e) {
        console.log("Could not set buffer parameters:", e);
      }
    }
    
    // Apply texture quality settings (reduces GPU memory usage and improves performance)
    if (window.AFRAME && AFRAME.scenes[0] && AFRAME.scenes[0].renderer) {
      const renderer = AFRAME.scenes[0].renderer;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio * PERFORMANCE.pixelRatioScale, 1.5));
    }
  } else {
    // Desktop optimizations
    const video = $('video360');
    if (video) {
      // Ensure hardware acceleration is enabled
      video.style.transform = 'translateZ(0)';
    }
  }
};

// Set up buffer monitoring and recovery for mobile
let lastBufferCheck = 0;
let bufferWarnings = 0;
const MAX_BUFFER_WARNINGS = 3;
let isRecoveringBuffer = false;

// Monitor buffer status and attempt recovery if needed
// PERFORMANCE IMPROVEMENT: Less aggressive buffer monitoring
const monitorVideoBuffer = (video, videoReady, xrMode) => {
  if (!isMobile || !videoReady || !xrMode) return;
  
  const now = Date.now();
  // Reduced frequency: Check every 10 seconds instead of 5
  if (now - lastBufferCheck < 10000) return;
  lastBufferCheck = now;
  
  if (video.paused) return; // Don't check if paused
  
  try {
    // Get current buffer state
    const buffered = video.buffered;
    let isBufferHealthy = false;
    
    if (buffered.length > 0) {
      // Check if we have enough buffer ahead
      const currentTime = video.currentTime;
      const bufferedEnd = buffered.end(buffered.length - 1);
      const bufferedAhead = bufferedEnd - currentTime;
      
      // Only log every few checks to reduce console spam
      if (now % 30000 < 1000) {
        console.log(`Buffer status: ${bufferedAhead.toFixed(2)}s ahead of current playback`);
      }
      
      // Consider buffer healthy if we have at least 8 seconds ahead (reduced from 10)
      isBufferHealthy = bufferedAhead >= 8;
    }
    
    if (!isBufferHealthy && !isRecoveringBuffer) {
      bufferWarnings++;
      console.log(`Buffer warning ${bufferWarnings}/${MAX_BUFFER_WARNINGS}`);
      
      if (bufferWarnings >= MAX_BUFFER_WARNINGS) {
        console.log("Buffer critically low, attempting recovery");
        attemptBufferRecovery(video);
      }
    } else if (isBufferHealthy) {
      // Reset warning count if buffer is healthy
      bufferWarnings = 0;
    }
  } catch (e) {
    console.log("Buffer monitoring error:", e);
  }
};

// Recovery function for buffer issues
const attemptBufferRecovery = (video) => {
  if (isRecoveringBuffer) return;
  isRecoveringBuffer = true;
  
  console.log("Starting buffer recovery process");
  showSpinner();
  
  // Store current playback state
  const currentTime = video.currentTime;
  const wasPlaying = !video.paused;
  
  // Pause video to allow buffer to build up
  if (wasPlaying) {
    video.pause();
  }
  
  // Set to a slightly earlier time to help rebuffer
  const seekBackTime = Math.max(0, currentTime - 2);
  video.currentTime = seekBackTime;
  
  // Give it some time to buffer, but less time on desktop
  const bufferTime = isMobile ? 3000 : 1500;
  setTimeout(() => {
    hideSpinner();
    
    if (wasPlaying) {
      // Resume playback
      video.play().catch(e => console.log("Recovery resume error:", e));
    }
    
    // Reset recovery state
    isRecoveringBuffer = false;
    bufferWarnings = 0;
  }, bufferTime);
};

// PERFORMANCE IMPROVEMENT: More efficient video syncing
// Use requestAnimationFrame for sync when possible
let syncAnimationFrame = null;
let lastSyncTime = 0;

// Sync video with audio
const syncVideo = (video, audio, videoReady, xrMode) => {
  if (!videoReady || !audio || !video || audio.paused || !xrMode) return;
  
  const now = performance.now();
  // Don't sync too frequently - use time-based throttling based on device
  // PERFORMANCE IMPROVEMENT: Use adaptive sync frequency
  const syncInterval = isMobile ? 250 : 100; // ms between syncs
  if (now - lastSyncTime < syncInterval) return;
  lastSyncTime = now;
  
  const audioCurrent = audio.currentTime;
  const videoCurrent = video.currentTime;
  const diff = Math.abs(audioCurrent - videoCurrent);
  
  // Only sync when difference exceeds threshold
  if (diff > PERFORMANCE.syncThreshold) {
    // For significant drift, use a hard seek
    if (diff > 1.0) {
      if (!isMobile || now % 5000 < 100) { // Limit logging
        console.log(`Major sync: audio=${audioCurrent.toFixed(2)}, video=${videoCurrent.toFixed(2)}, diff=${diff.toFixed(2)}`);
      }
      video.currentTime = audioCurrent;
    } 
    // For minor drift, use predictive sync on mobile (adjust playback rate)
    else if (PERFORMANCE.usePredictiveSync && isMobile) {
      // If video is behind audio, speed up slightly
      if (videoCurrent < audioCurrent) {
        video.playbackRate = 1.05; // 5% faster
        setTimeout(() => { video.playbackRate = 1.0; }, 500); // Reset after 500ms
      } 
      // If video is ahead of audio, slow down slightly
      else {
        video.playbackRate = 0.95; // 5% slower
        setTimeout(() => { video.playbackRate = 1.0; }, 500); // Reset after 500ms
      }
    }
    // For desktop or when predictive sync is disabled
    else {
      video.currentTime = audioCurrent;
    }
  }
};

// PERFORMANCE IMPROVEMENT: Use requestAnimationFrame for smoother syncing on desktop
const animationFrameSync = (video, audio, videoReady, xrMode) => {
  syncVideo(video, audio, videoReady, xrMode);
  syncAnimationFrame = requestAnimationFrame(() => {
    animationFrameSync(video, audio, videoReady, xrMode);
  });
};

// Set up an optimized sync interval
const setupSyncInterval = (video, audio, videoReady, xrMode) => {
  // Clear any existing sync mechanisms
  if (syncAnimationFrame) {
    cancelAnimationFrame(syncAnimationFrame);
    syncAnimationFrame = null;
  }
  
  // PERFORMANCE IMPROVEMENT: Use different sync strategies for desktop and mobile
  // Mobile uses setInterval, desktop uses requestAnimationFrame
  if (!isMobile && PERFORMANCE.useRequestAnimationFrame) {
    // Use requestAnimationFrame for smoother rendering on desktop
    syncAnimationFrame = requestAnimationFrame(() => {
      animationFrameSync(video, audio, videoReady, xrMode);
    });
    console.log("Set up animation frame sync for desktop");
    return null; // No interval to return
  } else {
    // Calculate interval based on performance settings - less frequent on mobile
    const syncIntervalTime = Math.floor(1000 / PERFORMANCE.maxSyncFrequency);
    
    // Set up new interval
    const syncInterval = setInterval(() => syncVideo(video, audio, videoReady, xrMode), syncIntervalTime);
    console.log(`Set up sync interval: ${syncIntervalTime}ms`);
    
    return syncInterval;
  }
};

// Set up buffer monitoring interval for mobile
const setupBufferMonitoring = (video, videoReady, xrMode) => {
  if (!isMobile) return null;
  
  // PERFORMANCE IMPROVEMENT: Less frequent buffer monitoring (10s instead of 5s)
  return setInterval(() => monitorVideoBuffer(video, videoReady, xrMode), 10000);
};

export {
  configureVideoForDevice,
  monitorVideoBuffer,
  attemptBufferRecovery,
  syncVideo,
  setupSyncInterval,
  setupBufferMonitoring
}; 