import { isMobile, isTeaser, outroCTA_backlink, devToggleAllowed } from './config.js';
import { $ } from './utils.js';
import { configureVideoForDevice } from './videoManager.js';
import { forceAFrameRender, recenter } from './renderer.js';

// UI state
let teaser = isTeaser;
let xrAllowed = false;
let xrMode = false;
let videoReady = false;
let audioReady = false;
let overlayShown = false;

// Get reference to loading spinner
const loadingSpinner = $('loadingSpinner');

// Function to control loading spinner visibility
const updateLoadingSpinnerVisibility = () => {
  if (videoReady && audioReady) {
    loadingSpinner.style.display = 'none';
  } else {
    // Show spinner only if landing overlay is hidden (i.e., after "Begin" is clicked)
    const landingOverlay = $('landingOverlay');
    if (landingOverlay.style.display === 'none') {
      loadingSpinner.style.display = 'flex';
    }
  }
};

// Update XR button based on state
const updateXrButton = () => {
  const modeBtn = $('toggleModeButton');
  const dot = modeBtn.querySelector('.status-dot');
  const ready = videoReady && audioReady;
  
  modeBtn.classList.toggle('disabled', !ready);
  modeBtn.disabled = !ready;
  dot.style.background = ready ? 'limegreen' : 'orange';
};

// Update layout based on current state
const layout = () => {
  const modeBtn = $('toggleModeButton');
  const recBtn = $('recenterButton');
  const xrModeBtn = $('xrToggleModeButton');
  const chapterNav = $('chapterNav');
  const xrWrap = $('xrContainer');
  const audioOnly = $('audioOnly');
  const video = $('video360');
  const overlay = $('ctaOverlay');
  
  // Ensure CTA overlay is hidden by default, only show if explicitly triggered
  if (!teaser || !overlayShown) {
    overlay.style.display = 'none';
  }
  
  modeBtn.style.display = xrAllowed && !teaser ? 'inline-flex' : 'none';
  recBtn.style.display = xrMode ? 'inline-block' : 'none';
  xrModeBtn.style.display = (xrMode && xrAllowed && !teaser) ? 'inline-block' : 'none';
  chapterNav.style.display = teaser ? 'none' : 'flex';
  xrWrap.style.display = (xrMode && xrAllowed) ? 'block' : 'none';
  audioOnly.style.display = (!xrMode || !xrAllowed) ? 'flex' : 'none';
  modeBtn.lastChild.textContent = xrMode ? ' Audio Only' : ' XR Mode';
  
  // Ensure A-Frame scene refreshes when made visible
  if(xrMode && xrAllowed) {
    // Force a browser reflow by accessing a layout property
    void xrWrap.offsetWidth;
    
    // Trigger resize event to help A-Frame recalculate dimensions
    window.dispatchEvent(new Event('resize'));
    
    // Force a render after a short delay
    setTimeout(forceAFrameRender, 50);
    
    // For mobile, try to play video even if muted
    if(isMobile && videoReady && !video.playing) {
      video.play().catch(e => console.log("Initial mobile play attempt:", e));
    }
  }
};

// Initialize UI controls
const initUI = (isXR) => {
  xrAllowed = isXR || teaser;
  if(teaser) xrMode = true;
  
  // Always ensure CTA overlay is hidden at initialization
  const overlay = $('ctaOverlay');
  overlay.style.display = 'none';
  
  // Dev toggle button
  const devBtn = $('devToggleButton');
  if(!devToggleAllowed) devBtn.style.display = 'none';
  
  devBtn.addEventListener('click', () => {
    teaser = !teaser;
    overlay.style.display = 'none';
    overlayShown = false;
    xrAllowed = isXR || teaser;
    xrMode = teaser;
    layout();
  });
  
  // Mode toggle button
  const modeBtn = $('toggleModeButton');
  modeBtn.addEventListener('click', () => {
    if(modeBtn.classList.contains('disabled')) return;
    
    // Store the current play state and time to restore after mode change
    const audio = $('audioPlayer');
    const video = $('video360');
    const wasPlaying = !audio.paused;
    const currentTime = audio.currentTime;
    
    // If playing, pause video if it's active and we are switching away from XR or to XR.
    // Audio will continue playing or be started shortly.
    if (wasPlaying) {
      // Only pause video if it's currently playing.
      // If switching to audio-only, video will be hidden by layout().
      // If switching to XR, video will be synced and played.
      if (xrMode && !video.paused) { // If currently in XR mode and video is playing
         // video.pause(); // Pause if leaving XR mode and video was playing.
      }
    }
    
    recenter();
    xrMode = !xrMode;
    layout();
    
    // Short timeout to let the DOM update before adjusting playback
    setTimeout(() => {
      // Always resync time after mode change
      if (xrMode && videoReady) {
        // Use a hard seek here, it's an explicit user action
        video.currentTime = currentTime;
      }
      
      // Resume playback if it was playing before
      if (wasPlaying) {
        audio.currentTime = currentTime; // Ensure audio time is still correct
        audio.play().then(() => {
          if (xrMode && videoReady) {
            // Always ensure video is muted and synced
            video.currentTime = audio.currentTime; 
            video.muted = true;
            
            video.play().catch((e) => {
              console.error("Mode toggle video play error:", e);
              // Retry playing video if initial attempt fails
              setTimeout(() => video.play().catch(e => console.error("Retry video play failed:", e)), 500);
            });
          } else if (!xrMode && !video.paused) {
            // If switched to audio-only, ensure video is paused
            video.pause();
          }
        }).catch(e => console.error("Audio resume error:", e));
      } else if (xrMode && videoReady) {
        // If it wasn't playing, but we are in XR mode, sync video time anyway
        video.currentTime = audio.currentTime;
      }
    }, 50);
  });
  
  // Recenter button
  const recBtn = $('recenterButton');
  recBtn.addEventListener('click', recenter);
  
  // CTA overlay
  const ctaBox = $('ctaBox');
  overlay.addEventListener('click', () => overlay.style.display = 'none');
  ctaBox.addEventListener('click', e => {
    e.stopPropagation();
    window.location.href = outroCTA_backlink;
  });
  
  // XR mode toggle button
  const xrModeBtn = $('xrToggleModeButton');
  xrModeBtn.addEventListener('click', () => {
    if(teaser) return;
    
    // Store the current play state and time to restore after mode change
    const audio = $('audioPlayer');
    const video = $('video360');
    const wasPlaying = !audio.paused;
    const currentTime = audio.currentTime;
    
    // If playing, pause video. Audio will continue.
    if (wasPlaying) {
      if (!video.paused) video.pause();
    }
    
    recenter();
    xrMode = false;
    layout();
    
    // Short timeout to let the DOM update before adjusting playback
    setTimeout(() => {
      // Resume audio playback if it was playing before
      if (wasPlaying) {
        audio.currentTime = currentTime; // Ensure audio time is still correct
        audio.play().catch(e => console.error("Audio resume error:", e));
      }
      // Ensure video is paused as we are in audio-only mode
      if (!video.paused) {
        video.pause();
      }
    }, 50);
  });
  
  // Chapter navigation
  $('prevChapter').addEventListener('click', () => {
    console.log("Previous chapter");
  });
  
  $('nextChapter').addEventListener('click', () => {
    console.log("Next chapter");
  });
  
  // Begin button
  const begin = $('beginBtn');
  const landing = $('landingOverlay');
  begin.addEventListener('click', async () => {
    if(isMobile && typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
      try {
        await DeviceOrientationEvent.requestPermission();
      } catch(e) {
        console.error("Permission error:", e);
      }
    }
    
    landing.style.display = 'none';
    
    // Configure video quality based on device capabilities
    configureVideoForDevice();
    
    // Show loading spinner now that landing overlay is hidden
    updateLoadingSpinnerVisibility();
    
    // For mobile, try to play muted video first to help with autoplay restrictions
    const video = $('video360');
    if(isMobile && xrMode && videoReady) {
      video.muted = true;
      video.play().catch(e => console.log("Initial click video play:", e));
    }
    
    // Start audio
    const audio = $('audioPlayer');
    audio.load();
    audio.play().then(() => {
      // If we want to start paused, uncomment: audio.pause()
    }).catch((e) => {
      console.error("Audio play error:", e);
      // Show some UI to inform user they need to interact
    });
    
    // Force A-Frame to update its rendering
    if(window.AFRAME) {
      setTimeout(() => {
        // Trigger a resize event to force A-Frame to re-render
        window.dispatchEvent(new Event('resize'));
        
        // Additional explicit rendering calls with increasing delays
        const renderAttempts = isMobile ? [100, 500] : [100, 300, 800, 1500];
        renderAttempts.forEach(delay => {
          setTimeout(() => {
            if(AFRAME.scenes[0] && AFRAME.scenes[0].renderer) {
              console.log(`Forcing render at ${delay}ms`);
              AFRAME.scenes[0].renderer.render(AFRAME.scenes[0].object3D, AFRAME.scenes[0].camera);
              
              // Ensure videosphere is visible during each render attempt
              const videosphere = $('videosphere');
              if(videosphere) {
                videosphere.setAttribute('visible', 'true');
              }
            }
          }, delay);
        });
      }, 100);
    }
  });
  
  // Initial layout setup
  layout();
  updateXrButton();
};

// CTA overlay handler
const handleCTAOverlay = (audio) => {
  // Ensure overlay is initially hidden
  const overlay = $('ctaOverlay');
  overlay.style.display = 'none';
  
  audio.addEventListener('timeupdate', () => {
    if(teaser && !overlayShown && audio.currentTime >= outroCTA_time) {
      overlay.style.display = 'flex';
      overlayShown = true;
    }
  });
};

// Update video ready state
const setVideoReady = (ready) => {
  videoReady = ready;
  updateXrButton();
  updateLoadingSpinnerVisibility();
};

// Update audio ready state
const setAudioReady = (ready) => {
  audioReady = ready;
  updateXrButton();
  updateLoadingSpinnerVisibility();
};

// Get current XR mode state
const getXRMode = () => xrMode;

export {
  initUI,
  updateXrButton,
  layout,
  handleCTAOverlay,
  setVideoReady,
  setAudioReady,
  getXRMode
}; 