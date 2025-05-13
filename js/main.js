import { XR_src, isXR, isMobile } from './config.js';
import { $, setupCleanup } from './utils.js';
import { configureVideoForDevice, setupBufferMonitoring } from './videoManager.js';
import { initUI, setVideoReady } from './uiController.js';
import { forceAFrameRender, setupVisibilityObserver, setupRendererOptimizations } from './renderer.js';
import { initAudio, setupAudioEvents } from './audioManager.js';

// PERFORMANCE IMPROVEMENT: Delayed setup for non-critical items
let bufferMonitorInterval = null;
let syncInterval = null;

// Main initialization function
const init = () => {
  // Get DOM elements
  const video = $('video360');
  const videoSource = $('videoSource');
  const xrContainer = $('xrContainer');
  
  // Initialize video
  videoSource.src = XR_src;
  video.load();
  
  // PERFORMANCE IMPROVEMENT: Apply video optimizations immediately
  // Always ensure video is muted regardless of other settings
  video.muted = true;
  
  // Set hardware acceleration hints
  video.style.transform = 'translateZ(0)';
  if ('preservesPitch' in video) video.preservesPitch = false;
  if ('playsInline' in video) video.playsInline = true;
  if ('webkitPlaysInline' in video) video.webkitPlaysInline = true;
  
  // Add error logging for debugging
  video.addEventListener('error', (e) => {
    console.error('Video error:', video.error, e);
    alert('Video error: ' + (video.error ? video.error.message : 'unknown'));
  });
  
  // Initialize UI
  initUI(isXR);
  
  // Set up videosphere visibility
  const videosphere = $('videosphere');
  videosphere.setAttribute('visible', 'true');
  
  // Initialize audio
  const audio = initAudio();
  
  // PERFORMANCE IMPROVEMENT: Set up critical video events
  // First optimization pass at metadata
  video.addEventListener('loadedmetadata', () => {
    console.log("Video metadata loaded");
    
    // For mobile, apply optimizations immediately
    if (isMobile) {
      configureVideoForDevice();
    }
  });
  
  // PERFORMANCE IMPROVEMENT: Prioritize getting video ready first
  video.addEventListener('loadeddata', () => {
    console.log("Video data loaded");
    setVideoReady(true);
    
    // Force quick initial renderer update but don't wait for full A-Frame
    if(window.AFRAME && AFRAME.scenes[0]) {
      if (AFRAME.scenes[0].renderer) {
        AFRAME.scenes[0].renderer.render(AFRAME.scenes[0].object3D, AFRAME.scenes[0].camera);
      }
      
      // Ensure videosphere is visible after video loads
      if(videosphere) {
        videosphere.setAttribute('visible', 'true');
        
        // For mobile, optimize the videosphere material immediately
        if (isMobile) {
          try {
            // Get the videosphere mesh
            const material = videosphere.getObject3D('mesh')?.material;
            if (material && material.map) {
              // Apply optimizations to the video texture
              material.map.minFilter = THREE.LinearFilter;
              material.map.generateMipmaps = false;
              material.needsUpdate = true;
              console.log("Applied early texture optimizations to videosphere");
            }
          } catch (e) {
            console.log("Could not apply early texture optimizations:", e);
          }
        }
      }
    }
    
    // PERFORMANCE IMPROVEMENT: Schedule non-critical setup after a delay
    // Delay initializing the buffer monitoring to prioritize initial rendering
    setTimeout(() => {
      // Set up buffer monitoring for mobile
      bufferMonitorInterval = setupBufferMonitoring(video, true, true);
    }, 2000);
    
    // For mobile, try to play muted video once it's loaded, but don't force it
    if(isMobile) {
      video.muted = true;
      video.play().catch(() => {
        // Silently fail - it's ok if this doesn't work immediately
      });
    }
  });
  
  // PERFORMANCE IMPROVEMENT: Defer audio event binding
  // Set up audio events with slight delay to prioritize video
  setTimeout(() => {
    syncInterval = setupAudioEvents(audio, video);
  }, 500);
  
  // Set up XR container visibility observer
  const containerObserver = setupVisibilityObserver(xrContainer);
  
  // Set up A-Frame and THREE.js optimizations
  setupRendererOptimizations();
  
  // Set up cleanup on page unload
  setupCleanup(video, audio, syncInterval, bufferMonitorInterval);
};

// PERFORMANCE IMPROVEMENT: Wait a bit longer for DOMContentLoaded if on mobile
// Initialize on DOM content loaded with a slight delay on mobile for better load performance
if (isMobile) {
  window.addEventListener('DOMContentLoaded', () => {
    // For mobile, introduce a small delay to allow browser to stabilize
    setTimeout(init, 100);
  });
} else {
  window.addEventListener('DOMContentLoaded', init);
}

export { init }; 