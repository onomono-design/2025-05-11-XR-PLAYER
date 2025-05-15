// Import the $ function for selecting DOM elements
import { $, showSpinner, hideSpinner, setupCleanup } from './js/utils.js';

// Import setupSyncInterval from videoManager
import { setupSyncInterval as videoManagerSyncInterval } from './js/videoManager.js';

// Configuration constants
// Import config values to ensure they're properly used
import { 
  XR_src as ConfigXR_src, 
  audio_src as ConfigAudio_src,
  thumbnail_src as ConfigThumbnail_src,
  isXR as ConfigIsXR, 
  isTeaser as ConfigIsTeaser,
  outroCTA_time as ConfigOutroCTA_time,
  outroCTA_backlink as ConfigOutroCTA_backlink,
  devToggleAllowed as ConfigDevToggleAllowed,
  isMobile as ConfigIsMobile,
  PERFORMANCE as ConfigPERFORMANCE,
  isIOS as ConfigIsIOS,
  isIOSSafari as ConfigIsIOSSafari
} from './js/config.js';

// Use imported values or fallback to local
const XR_src= ConfigXR_src || "https://cmm-cloud-2.s3.us-west-1.amazonaws.com/WALKING+TOURS/2025-04-10-JAPANTOWN-XR/2025-04-21-CHINATOWN-XR-UPDATE/2025-04-21-CHINATOWN-XR-2b-low.mp4";
// ENHANCEMENT: Add fallback video sources for better compatibility
const XR_src_fallback_HLS="https://cmm-cloud-2.s3.us-west-1.amazonaws.com/WALKING+TOURS/2025-04-10-JAPANTOWN-XR/2025-04-21-CHINATOWN-XR-UPDATE/2025-04-21-CHINATOWN-XR-2b-low.m3u8";
const XR_src_fallback_WEBM="https://cmm-cloud-2.s3.us-west-1.amazonaws.com/WALKING+TOURS/2025-04-10-JAPANTOWN-XR/2025-04-21-CHINATOWN-XR-UPDATE/2025-04-21-CHINATOWN-XR-2b-low.webm";
const XR_src_low="https://cmm-cloud-2.s3.us-west-1.amazonaws.com/WALKING+TOURS/2025-04-10-JAPANTOWN-XR/2025-04-21-CHINATOWN-XR-UPDATE/2025-04-21-CHINATOWN-XR-2b-ultralow.mp4";
const audio_src= ConfigAudio_src || "https://cmm-cloud-2.s3.us-west-1.amazonaws.com/WALKING+TOURS/2025-03-15-CHINATOWN/2025-03-15-CHINATOWN-MP3S/2025-04-21-SHORTER-MP3-CHAPTERS/2025-04-21-Chapter+2+Look+Tin+Eli.mp3";
// ENHANCEMENT: Add fallback audio source
const audio_src_fallback="https://cmm-cloud-2.s3.us-west-1.amazonaws.com/WALKING+TOURS/2025-03-15-CHINATOWN/2025-03-15-CHINATOWN-MP3S/2025-04-21-SHORTER-MP3-CHAPTERS/2025-04-21-Chapter+2+Look+Tin+Eli.ogg";
const thumbnail_src= ConfigThumbnail_src || "https://placehold.co/1024x1024/1E1E1E/FFFFFF?text=Album+Art";
const chapterName="Look Tin Eli",chapterOrder=2,tourName="Chinatown Tour";
const isXR= ConfigIsXR !== undefined ? ConfigIsXR : true;
const isTeaser= ConfigIsTeaser !== undefined ? ConfigIsTeaser : false;
const outroCTA_time= ConfigOutroCTA_time || 20;
const outroCTA_backlink= ConfigOutroCTA_backlink || "https://example.com/full-tour";
const devToggleAllowed= ConfigDevToggleAllowed !== undefined ? ConfigDevToggleAllowed : true;
const isMobile= ConfigIsMobile !== undefined ? ConfigIsMobile : matchMedia('(pointer:coarse)').matches;

// ENHANCEMENT: Device capability detection
const deviceCapabilities = {
  isLowEndDevice: false,
  supportsHLS: 'MediaSource' in window && MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E,mp4a.40.2"'),
  supportsWebM: document.createElement('video').canPlayType('video/webm; codecs="vp8, vorbis"').replace(/no/, ''),
  videoFrameCallbackSupported: false, // Will be determined after video element is created
  estimatedBandwidth: 0, // Will be estimated during load
  isAppleDevice: ConfigIsIOS, // Use the improved detection from config.js
  isIOSSafari: ConfigIsIOSSafari, // Use Safari-specific detection for better iOS handling
  batteryLevel: null,
  lowPowerMode: false
};

// ENHANCEMENT: Try to detect battery status for power-aware optimizations
if ('getBattery' in navigator) {
  navigator.getBattery().then(battery => {
    deviceCapabilities.batteryLevel = battery.level;
    
    // Listen for battery changes
    battery.addEventListener('levelchange', () => {
      deviceCapabilities.batteryLevel = battery.level;
      
      // If battery is below 20%, enable more aggressive power saving
      if (battery.level < 0.2) {
        deviceCapabilities.lowPowerMode = true;
        adjustPerformanceForBattery();
      } else {
        deviceCapabilities.lowPowerMode = false;
      }
    });
  });
}

// ENHANCEMENT: Function to adjust performance for battery level
function adjustPerformanceForBattery() {
  if (deviceCapabilities.lowPowerMode) {
    console.log("Low battery detected, applying power optimizations");
    PERFORMANCE.textureQuality *= 0.8;
    PERFORMANCE.videoScale *= 0.8;
    PERFORMANCE.pixelRatioScale *= 0.8;
    PERFORMANCE.textureUpdateInterval = Math.max(PERFORMANCE.textureUpdateInterval, 150);
    
    // Apply changes if the renderer exists
    if (window.AFRAME && AFRAME.scenes[0] && AFRAME.scenes[0].renderer) {
      AFRAME.scenes[0].renderer.setPixelRatio(Math.min(window.devicePixelRatio * PERFORMANCE.pixelRatioScale, 1.0));
    }
  }
}

// ENHANCEMENT: Detect if device is low-end based on various factors
function detectLowEndDevice() {
  // Use factors that correlate with low-end devices
  const memory = navigator.deviceMemory || 4; // Default to 4GB if not available
  const cpuCores = navigator.hardwareConcurrency || 4; // Default to 4 cores
  
  // Consider low-end if less than 4GB RAM or fewer than 4 cores
  deviceCapabilities.isLowEndDevice = memory < 4 || cpuCores < 4;
  
  // Also check for older browsers without recent APIs
  if (!window.requestAnimationFrame || !window.requestIdleCallback) {
    deviceCapabilities.isLowEndDevice = true;
  }
  
  console.log(`Device capabilities - Memory: ${memory}GB, CPU: ${cpuCores} cores, Low-end: ${deviceCapabilities.isLowEndDevice}`);
  
  // Adjust performance settings for low-end devices
  if (deviceCapabilities.isLowEndDevice) {
    PERFORMANCE.textureQuality *= 0.7;
    PERFORMANCE.videoScale *= 0.7; 
    PERFORMANCE.pixelRatioScale *= 0.7;
    PERFORMANCE.textureUpdateInterval = 200; // ~5fps
    PERFORMANCE.useLowerBitDepthTextures = true;
  }
}

// NEW: Register service worker and prime media cache
if ('serviceWorker' in navigator) {
  // Check if service worker is already controlling the page
  const isControlled = Boolean(navigator.serviceWorker.controller);
  let serviceWorkerRegistration = null;
  
  // Register service worker
  navigator.serviceWorker.register('sw.js')
    .then(registration => {
      console.log('Service Worker registered with scope:', registration.scope);
      serviceWorkerRegistration = registration;
      
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.action === 'mediaCached') {
          console.log('Media cache status:', event.data.status);
        }
      });
      
      // Listen for service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            console.log('Updated Service Worker activated');
            // Prime media cache after update
            primeMediaCache();
          }
        });
      });
      
      // Prime media cache if service worker is ready
      if (isControlled) {
        primeMediaCache();
      } else {
        // Wait for the service worker to be activated
        navigator.serviceWorker.ready.then(() => {
          primeMediaCache();
        }).catch(error => {
          console.error('Service worker activation failed:', error);
        });
      }
    })
    .catch(error => {
      console.log('Service Worker registration failed:', error);
    });
    
  // Add a more robust primeMediaCache function
  function primeMediaCache() {
    if (!navigator.serviceWorker.controller) {
      console.warn('No active service worker found, cannot prime media cache');
      return;
    }
    
    try {
      navigator.serviceWorker.controller.postMessage({
        action: 'primeMediaCache'
      });
      
      console.log('Requested media cache priming');
    } catch (error) {
      console.error('Error requesting media cache priming:', error);
    }
  }
}

// Performance optimization settings
const PERFORMANCE = ConfigPERFORMANCE || {
  // Lower is better for performance, higher for quality
  textureQuality: isMobile ? 0.5 : 1.0,
  useProgressiveLoading: true,
  // Controls how aggressively we downscale video
  videoScale: isMobile ? 0.5 : 1.0, // Increased downscaling on mobile
  // How much to reduce pixel ratio on mobile
  pixelRatioScale: isMobile ? 0.5 : 1.0, // Increased downscaling for pixel ratio
  // Buffer size for mobile (in seconds)
  mobileBufferSize: 30,
  // Maximum sync operations per second
  maxSyncFrequency: isMobile ? 1 : 4, 
  // Use RAF instead of setTimeout for renders
  useRequestAnimationFrame: true,
  // Only sync when difference exceeds this threshold (in seconds)
  syncThreshold: isMobile ? 0.75 : 0.2,
  // Predictive sync (use audio playback rate instead of seeking)
  usePredictiveSync: true, // Enable for both mobile and desktop
  // NEW: Use requestVideoFrameCallback if available
  useRequestVideoFrameCallback: true,
  // NEW: Throttle video texture updates for performance
  textureUpdateInterval: isMobile ? 100 : 33, // ~10fps on mobile, ~30fps on desktop
  // NEW: Use lower bit depth textures on mobile
  useLowerBitDepthTextures: isMobile,
  // ENHANCEMENT: Add adaptive streaming boolean
  useAdaptiveStreaming: true,
  // ENHANCEMENT: Add memory management settings
  aggressiveGarbageCollection: isMobile,
  gcIntervalMs: isMobile ? 30000 : 60000, // GC interval
  // ENHANCEMENT: Max recovery attempts before falling back to lower quality
  maxRecoveryAttempts: 3
};

// ENHANCEMENT: Setup memory management
let gcInterval = null;
if (PERFORMANCE.aggressiveGarbageCollection) {
  gcInterval = setInterval(() => {
    if (window.gc) {
      // Only works if JavaScript engine exposes GC
      console.log("Triggering memory cleanup");
      window.gc();
    } else {
      // Better approach than creating temporary objects
      console.log("Suggesting memory cleanup to browser");
      
      // Clear any cached objects in our code
      if (window.textureCache) {
        window.textureCache.clear();
      }
      
      // Use the browser's low-memory API if available
      if (navigator.sendBeacon) {
        navigator.sendBeacon('javascript:void(0)', '');
      }
      
      // Schedule cleanup during idle time if possible
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          // Clear any object references we no longer need
          // This is a hint to the GC
        }, { timeout: 1000 });
      }
    }
  }, PERFORMANCE.gcIntervalMs);
}

// ENHANCEMENT: Network quality detection
let networkQuality = "high"; // Default to high
let networkCheckInterval = null;
let lastCheckSpeed = 0;

function checkNetworkQuality() {
  const start = Date.now();
  const imageUrl = "https://cmm-cloud-2.s3.us-west-1.amazonaws.com/network-test.jpg?" + start;
  
  // Create a test image to download for bandwidth estimation
  const img = new Image();
  img.onload = function() {
    const end = Date.now();
    const duration = (end - start) / 1000; // seconds
    const imageSize = 50; // Approximate size in KB
    
    // Calculate approximate bandwidth in Kbps
    const kbps = (imageSize * 8) / duration;
    
    lastCheckSpeed = kbps;
    
    // Classify network quality
    if (kbps < 1500) {
      networkQuality = "low";
    } else if (kbps < 5000) {
      networkQuality = "medium";
    } else {
      networkQuality = "high";
    }
    
    console.log(`Network quality: ${networkQuality} (${kbps.toFixed(2)} Kbps)`);
    
    // Adjust video quality if adaptive streaming is enabled
    if (PERFORMANCE.useAdaptiveStreaming && video && videoReady) {
      adjustVideoQualityForNetwork();
    }
  };
  
  img.onerror = function() {
    // If test fails, assume low quality
    networkQuality = "low";
    console.log("Network test failed, assuming low quality");
  };
  
  img.src = imageUrl;
}

// Start regular network quality checks
networkCheckInterval = setInterval(checkNetworkQuality, 30000); // Every 30 seconds
checkNetworkQuality(); // Run immediately

// ENHANCEMENT: Adjust video quality based on network conditions
function adjustVideoQualityForNetwork() {
  if (!videoReady || !video) return;
  
  // Only change source if significant quality change and video is paused or not started
  if (video.paused || video.currentTime < 0.5) {
    if (networkQuality === "low" && !video.src.includes("-ultralow")) {
      console.log("Switching to lower quality video due to network conditions");
      switchToLowerQualityVideo();
    }
  }
}

// ENHANCEMENT: Function to switch to lower quality video
function switchToLowerQualityVideo() {
  if (!video) return;
  
  // Store current state
  const currentTime = video.currentTime;
  const wasPlaying = !video.paused;
  
  // Pause playback
  if (wasPlaying) video.pause();
  
  // Show loading indicator
  showSpinner();
  showUserMessage("Adapting to network conditions...", 2000);
  
  // Switch to lower quality source
  vs.src = XR_src_low;
  video.load();
  
  // Reset state after source change
  video.onloadeddata = function() {
    // Restore time position
    video.currentTime = currentTime;
    
    // Resume if was playing
    if (wasPlaying) {
      video.play().catch(e => console.log("Error resuming after quality switch:", e));
    }
    
    hideSpinner();
    showUserMessage("Video quality adjusted for better playback", 2000);
  };
}

// ENHANCEMENT: User notification system
let messageTimeout = null;
function showUserMessage(message, duration = 3000) {
  // First clear any existing messages
  if (messageTimeout) {
    clearTimeout(messageTimeout);
    messageTimeout = null;
  }
  
  // Get or create message element
  let messageEl = document.getElementById('userMessage');
  if (!messageEl) {
    messageEl = document.createElement('div');
    messageEl.id = 'userMessage';
    messageEl.className = 'user-message';
    document.body.appendChild(messageEl);
  }
  
  // Set message and show
  messageEl.textContent = message;
  messageEl.classList.add('visible');
  
  // Hide after duration
  messageTimeout = setTimeout(() => {
    messageEl.classList.remove('visible');
  }, duration);
}

// NEW A-Frame component for camera recentering
AFRAME.registerComponent('camera-recenter', {
  schema: {
    // Add any schema properties if needed in the future
  },
  init: function() {
    console.log('Camera recenter component initialized on:', this.el.tagName);
    
    // Wait a frame to ensure the element is properly initialized
    setTimeout(() => {
      this.initComponent();
    }, 0);
  },
  
  initComponent: function() {
    this.cameraEl = this.el; // Assumes this component is attached to the camera entity
    console.log('Camera recenter running delayed initialization');

    if (!this.cameraEl.isEntity || !this.cameraEl.hasAttribute('camera')) {
        console.warn('camera-recenter component is not attached to a camera entity. Ensure it is on the <a-camera> element.');
        // Attempt to find the scene's active camera if not directly on a camera.
        if (this.el.sceneEl && this.el.sceneEl.camera) {
             this.cameraEl = this.el.sceneEl.camera.el;
             console.log('Fallback: Found scene camera for recenter component:', this.cameraEl);
        } else {
            console.error('CRITICAL: Could not find a camera for camera-recenter component.');
            // Further fallback: try to find camera by selector
            const sceneEl = document.querySelector('a-scene');
            if (sceneEl) {
              const cameraEl = sceneEl.querySelector('[camera]');
              if (cameraEl) {
                console.log('Second fallback: Found camera by query selector:', cameraEl);
                this.cameraEl = cameraEl;
              }
            }
            if (!this.cameraEl) {
              console.error('All fallback attempts failed. Camera recentering may not work.');
              return;
            }
        }
    }
    
    // Store initial target rotation for reference
    this.targetRotation = { x: 0, y: 0, z: 0 }; // Initial centered view
    this.deviceOrientationOffset = { alpha: 0, beta: 0, gamma: 0 };
    this.lastDeviceOrientation = null;
    
    // Expose a global function that can be called from anywhere
    window.recenterCameraFromAFrame = this.recenterView.bind(this);
    
    // Listen for recenter events
    this.cameraEl.addEventListener('recenter', this.recenterView.bind(this));
    
    // Setup device orientation tracking if on mobile
    this.setupDeviceOrientationTracking();
    
    console.log('Camera recenter component fully initialized');
  },
  
  setupDeviceOrientationTracking: function() {
    if (AFRAME.utils.device.isMobile() || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.deviceOrientationHandler = this.handleDeviceOrientation.bind(this);
      window.addEventListener('deviceorientation', this.deviceOrientationHandler);
    }
  },
  
  handleDeviceOrientation: function(event) {
    this.lastDeviceOrientation = {
      alpha: event.alpha || 0,
      beta: event.beta || 0,
      gamma: event.gamma || 0
    };
  },
  
  recenterView: function() { // Renamed to avoid conflict with a potential 'recenter' event
    console.log('A-Frame camera-recenter component recenterView called');
    try {
      if (!this.cameraEl) {
          console.error('Camera element not found in camera-recenter component for recenterView.');
          return false;
      }

      const lookControls = this.cameraEl.components['look-controls'];
      if (!lookControls) {
        console.error('Look-controls component not found on camera:', this.cameraEl);
        return false;
      }

      const isMobile = AFRAME.utils.device.isMobile() || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      console.log('Recenter: Device detected as:', isMobile ? 'mobile' : 'desktop');
      showUserMessage(isMobile ? "Recentering view based on device orientation" : "Resetting camera view", 1500);


      if (isMobile) {
        // MOBILE RECENTER LOGIC: Make current orientation the new reference point (0 0 0)
        const videosphereEl = document.querySelector('#videosphere');
        if (!videosphereEl) {
          console.error('Videosphere entity with id="videosphere" not found for mobile recenter.');
          return false;
        }

        // Get current camera world orientation
        const cameraObject3D = this.cameraEl.object3D;
        const tempQuaternion = new THREE.Quaternion();
        cameraObject3D.getWorldQuaternion(tempQuaternion);
        
        const cameraWorldEulerYXZ = new THREE.Euler();
        cameraWorldEulerYXZ.setFromQuaternion(tempQuaternion, 'YXZ');

        const cameraWorldYawDeg = THREE.MathUtils.radToDeg(cameraWorldEulerYXZ.y);
        
        console.log('Mobile Recenter: Current camera world yaw (degrees):', cameraWorldYawDeg);
        
        // Instead of just adjusting videosphere, we're resetting everything
        // Step 1: Reset the look-controls rotation objects to zero
        if (lookControls.yawObject) {
          lookControls.yawObject.rotation.y = 0; 
        }
        if (lookControls.pitchObject) {
          lookControls.pitchObject.rotation.x = 0;
        }
        
        // Step 2: Set videosphere rotation to compensate for the camera's current world rotation
        // This makes the current view direction the new "front" (0,0,0)
        videosphereEl.setAttribute('rotation', {
          x: 0,
          y: cameraWorldYawDeg,
          z: 0
        });
        
        // Step 3: Reset camera's local rotation to be the new reference point
        this.cameraEl.setAttribute('rotation', {x: 0, y: 0, z: 0});
        
        // Step 4: Update the stored reference rotations for future recenters
        if (window.localInitialCameraRotation) {
          window.localInitialCameraRotation = {x: 0, y: 0, z: 0};
        }
        if (window.localInitialVideosphereRotation) {
          window.localInitialVideosphereRotation = {x: 0, y: cameraWorldYawDeg, z: 0};
        }
        
        // Step 5: Reset orientation tracking state if needed
        if (typeof lookControls.updateOrientation === 'function') {
          lookControls.updateOrientation();
        }
        if (lookControls.deviceOrientationMagicWindowDelta) {
            lookControls.deviceOrientationMagicWindowDelta.set(0,0,0);
            console.log('Mobile Recenter: Reset deviceOrientationMagicWindowDelta.');
        }
        
        console.log('Mobile Recenter: Made current direction the new home orientation (0,0,0)');

      } else {
        // DESKTOP RECENTER LOGIC: Reset camera to fixed orientation (0, 0, 0)
        // NOTE: Updated to use (0, 0, 0) for matching videosphere orientation
        const desktopTargetRotationDeg = { x: 0, y: 0, z: 0 };

        if (lookControls.yawObject && lookControls.pitchObject) {
          lookControls.pitchObject.rotation.x = THREE.MathUtils.degToRad(desktopTargetRotationDeg.x);
          lookControls.yawObject.rotation.y = THREE.MathUtils.degToRad(desktopTargetRotationDeg.y);
          
          if (typeof lookControls.updateRotation === 'function') {
              lookControls.updateRotation();
          } else if (typeof lookControls.update === 'function') {
              lookControls.update();
          }
          console.log('Desktop Recenter: Reset look-controls pitch/yaw to target:', desktopTargetRotationDeg);
        } else {
          console.warn('Desktop Recenter: Look-controls yawObject or pitchObject not available.');
        }
        this.cameraEl.setAttribute('rotation', desktopTargetRotationDeg);
        console.log('Desktop Recenter: Set camera entity rotation attribute to:', desktopTargetRotationDeg);
      }

      // Force A-Frame to update the camera view and render
      if (AFRAME.scenes[0] && AFRAME.scenes[0].camera) {
        AFRAME.scenes[0].camera.updateMatrixWorld(true); // Force update
      }
      if (typeof forceAFrameRender === 'function') { // Assuming forceAFrameRender is globally available
        forceAFrameRender();
      } else if (this.el.sceneEl) {
        this.el.sceneEl.renderer.render(this.el.sceneEl.object3D, this.el.sceneEl.camera); // Basic render
      }

      console.log('Camera recentering via component completed.');
      return true;

    } catch (e) {
      console.error('Error in A-Frame camera-recenter component recenterView:', e);
      return false;
    }
  }
});

// Global function to trigger recentering via the component
window.recenterCamera = function() {
  console.log('Global recenterCamera function called');
  
  // First try to find by ID
  let cameraEl = document.querySelector('#cameraEntity');
  
  // If not found by ID, try other selectors
  if (!cameraEl || !cameraEl.components || !cameraEl.components['camera-recenter']) {
    console.warn('Camera entity with ID "cameraEntity" not found or missing component. Trying fallbacks...');
    
    // Try finding any entity with camera-recenter
    cameraEl = document.querySelector('[camera-recenter]');
    
    // If still not found, try any camera
    if (!cameraEl || !cameraEl.components || !cameraEl.components['camera-recenter']) {
      cameraEl = document.querySelector('[camera]');
      console.log('Trying to find any camera entity:', cameraEl);
    }
    
    // If all attempts failed
    if (!cameraEl) {
      console.error('Could not find any camera entity. Cannot recenter.');
      return false;
    }
  }
  
  // Try using the component's method if available
  if (cameraEl.components && cameraEl.components['camera-recenter']) {
    console.log('Found camera entity with camera-recenter component, dispatching recenter event.');
    // Dispatch the recenter event to ensure it's handled properly
    cameraEl.dispatchEvent(new CustomEvent('recenter'));
    return true;
  } else {
    console.error('Camera entity found but missing camera-recenter component.');
    
    // Fallback to a basic camera reset
    try {
      console.log('Attempting basic camera reset as fallback');
      cameraEl.setAttribute('rotation', {x: 0, y: 0, z: 0});
      
      // Try to update look-controls if available
      if (cameraEl.components && cameraEl.components['look-controls']) {
        const lookControls = cameraEl.components['look-controls'];
        if (lookControls.yawObject) lookControls.yawObject.rotation.y = THREE.MathUtils.degToRad(0);
        if (lookControls.pitchObject) lookControls.pitchObject.rotation.x = 0;
      }
      
      // Force a render update
      if (window.AFRAME && AFRAME.scenes[0] && AFRAME.scenes[0].renderer) {
        AFRAME.scenes[0].renderer.render(AFRAME.scenes[0].object3D, AFRAME.scenes[0].camera);
      }
      
      return true;
    } catch (e) {
      console.error('Even fallback camera reset failed:', e);
      return false;
    }
  }
};

// Configure video quality for mobile devices
const configureVideoForDevice = () => {
  // ENHANCEMENT: Run device capability detection first
  detectLowEndDevice();
  
  if (isMobile) {
    // Reduce video element size for mobile to improve performance
    const video = document.getElementById('video360');
    if (video) {
      // Set maximum dimensions for mobile to help with performance
      video.style.maxWidth = `${Math.round(1280 * PERFORMANCE.videoScale)}px`;
      video.style.maxHeight = `${Math.round(720 * PERFORMANCE.videoScale)}px`;
      
      // For mobile, we can also set lower resolution on the video element directly
      // This forces a lower internal resolution in memory
      video.width = Math.round(1280 * PERFORMANCE.videoScale);
      video.height = Math.round(720 * PERFORMANCE.videoScale);
      
      // NEW: Set video quality and playback hints
      if ('playsInline' in video) video.playsInline = true;
      if ('webkitPlaysInline' in video) video.webkitPlaysInline = true;
      
      // NEW: Add explicit hints for memory-efficient video playback
      video.preload = "auto";
      
      // NEW: Signal to the browser this isn't a high-quality video playback
      if ('preservesPitch' in video) video.preservesPitch = false;
      
      // Adjust buffering strategy - this is key for mobile performance
      try {
        // Most browsers support this, but wrap in try/catch for safety
        video.preload = "auto"; // Ensure preloading is enabled
      } catch (e) {
        console.log("Could not set buffer parameters:", e);
      }
      
      // Disable hardware acceleration if it's causing problems
      // This can sometimes resolve texture loading issues on certain devices
      // Uncomment if needed:
      // video.style.webkitTransform = 'translateZ(0)';
      // video.style.transform = 'translateZ(0)';
    }
    
    // Apply texture quality settings (reduces GPU memory usage and improves performance)
    if (window.AFRAME && AFRAME.scenes[0] && AFRAME.scenes[0].renderer) {
      const renderer = AFRAME.scenes[0].renderer;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio * PERFORMANCE.pixelRatioScale, 1.5));
    }
    
    // ENHANCEMENT: Additional optimizations for low-power mode
    if (deviceCapabilities.lowPowerMode) {
      adjustPerformanceForBattery();
    }
    
    // ENHANCEMENT: For very low-end devices, use even more aggressive settings
    if (deviceCapabilities.isLowEndDevice) {
      // Set maximum dimensions even lower
      video.width = Math.round(640 * PERFORMANCE.videoScale);
      video.height = Math.round(360 * PERFORMANCE.videoScale);
    }
  }
};

// Store initial camera and videosphere orientations for reference
let initialCameraRotation = {x: 0, y: 0, z: 0};
let initialVideosphereRotation = {x: 0, y: 0, z: 0};

// Initialize desktop-specific camera controls
function setupDesktopCameraControls() {
  if (!camera || !window.AFRAME) return;
  
  console.log("Setting up desktop-specific camera controls");
  
  const desktopControls = {
    touchEnabled: true,
    magicWindowTrackingEnabled: false, // Explicitly disable device orientation on desktop
    pointerLockEnabled: false,
    reverseMouseDrag: false,
    dragFactor: 1.0,             // Normal mouse drag sensitivity
    horizontalDragFactor: 1.0,   // Normal horizontal drag
    verticalDragFactor: 1.0,     // Normal vertical drag (allow full tilt control)
    smoothingEnabled: true,
    smoothingFactor: 0.15
  };
  
  camera.setAttribute('look-controls', desktopControls);
  console.log("Applied desktop mouse controls with full pan and tilt capability");
}

// For mobile fallback when orientation is denied or unavailable
function setupMobileFallbackControls() {
  if (!camera || !window.AFRAME) return;
  
  console.log("Setting up mobile fallback touch controls");
  
  const fallbackTouchControls = {
    touchEnabled: true,
    magicWindowTrackingEnabled: false, // Disable device orientation
    pointerLockEnabled: false,
    reverseMouseDrag: false,
    // Allow full control with touch since device orientation isn't available
    dragFactor: 0.5,           // Higher sensitivity for better experience
    horizontalDragFactor: 1.0, // Full horizontal control
    verticalDragFactor: 1.0,   // Full vertical control since no orientation
    smoothingEnabled: true,
    smoothingFactor: 0.15
  };
  
  camera.setAttribute('look-controls', fallbackTouchControls);
  console.log("Applied enhanced mobile touch controls with full pan and tilt");
}

// For mobile with device orientation enabled
function setupMobileOrientationControls() {
  if (!camera || !window.AFRAME) return;
  
  console.log("Setting up mobile device orientation controls");
  
  const orientationControls = {
    touchEnabled: true,
    magicWindowTrackingEnabled: true, // Enable device orientation tracking
    pointerLockEnabled: false,
    reverseMouseDrag: false,
    // Custom factors to make touch only affect horizontal rotation
    dragFactor: 0.2,           // Make drag less sensitive for better control
    verticalDragFactor: 0.0001, // Nearly disable vertical drag from touch (horizon lock)
    horizontalDragFactor: 1.0,  // Keep horizontal drag at normal sensitivity
    smoothingEnabled: true,
    smoothingFactor: 0.15
  };
  
  camera.setAttribute('look-controls', orientationControls);
  console.log("Applied mobile device orientation controls with touch panning only");
}

window.addEventListener('DOMContentLoaded',()=>{
 const audio=$('audioPlayer'),video=$('video360'),vs=$('videoSource');
 const art=$('artworkImg'),track=$('trackInfo'),camera=$('cameraEntity');
 const recBtn=$('recenterButton'),modeBtn=$('toggleModeButton'),devBtn=$('devToggleButton');
 const xrModeBtn=$('xrToggleModeButton');
 const xrWrap=$('xrContainer'),audioOnly=$('audioOnly');
 const landing=$('landingOverlay'),begin=$('beginBtn');
 const spinner=$('loadingSpinner'),overlay=$('ctaOverlay'),ctaBox=$('ctaBox');
 const chapterNav=$('chapterNav');
 const videosphere=$('videosphere');
 
 // Initialize with teaser mode EXPLICITLY disabled and CTA overlay hidden
 let teaser = false; // Force to false regardless of the constant value
 let xrAllowed = isXR || teaser;
 let xrMode = false;
 let videoReady = false;
 let audioReady = false;
 let overlayShown = false;
 
 // Local reference to initial rotation values
 let localInitialCameraRotation = {x: 0, y: 0, z: 0}; // Update to match videosphere orientation
 let localInitialVideosphereRotation = {x: 0, y: 0, z: 0};
 
 // Ensure CTA overlay is hidden at startup with !important to override any CSS
 overlay.style.setProperty('display', 'none', 'important');
 
 // ENHANCEMENT: Create error container
 const errorContainer = document.createElement('div');
 errorContainer.id = 'errorContainer';
 errorContainer.className = 'error-container';
 document.body.appendChild(errorContainer);
 
 // ENHANCEMENT: Create error feedback function
 const showErrorMessage = (message, isRecoverable = true) => {
   errorContainer.innerHTML = `
     <div class="error-content">
       <div class="error-icon">⚠️</div>
       <div class="error-message">${message}</div>
       ${isRecoverable ? '<button class="error-button">Try Again</button>' : ''}
     </div>
   `;
   errorContainer.style.display = 'flex';
   
   // Add retry button functionality
   if (isRecoverable) {
     const retryBtn = errorContainer.querySelector('.error-button');
     retryBtn.addEventListener('click', () => {
       errorContainer.style.display = 'none';
       // Try to recover based on context
       recoverFromError();
     });
   }
 };
 
 // ENHANCEMENT: Add error recovery function
 let recoveryAttempts = 0;
 const recoverFromError = () => {
   recoveryAttempts++;
   showSpinner();
   
   // After multiple attempts, try switching to lower quality
   if (recoveryAttempts >= PERFORMANCE.maxRecoveryAttempts) {
     showUserMessage("Switching to lower quality for better performance", 3000);
     switchToLowerQualityVideo();
     recoveryAttempts = 0;
     return;
   }
   
   if (!videoReady && video) {
     // Try reloading video
     console.log("Attempting to recover video playback");
     video.load();
   }
   
   if (!audioReady && audio) {
     // Try reloading audio
     console.log("Attempting to recover audio playback");
     audio.load();
   }
   
   // Force a re-render of the scene
   setTimeout(() => {
     forceAFrameRender();
     hideSpinner();
   }, 1000);
 };
 
 // ENHANCEMENT: Handle video errors with better recovery
 video.addEventListener('error', (e) => {
   console.error('Video error:', video.error, e);
   
   // Check if we have a fallback format we can try
   if (recoveryAttempts === 0 && deviceCapabilities.supportsHLS && !video.src.includes('.m3u8')) {
     console.log("Trying HLS fallback format");
     showUserMessage("Trying alternative video format...", 2000);
     vs.src = XR_src_fallback_HLS;
     video.load();
     recoveryAttempts++;
   } else if (recoveryAttempts === 1 && deviceCapabilities.supportsWebM && !video.src.includes('.webm')) {
     console.log("Trying WebM fallback format");
     showUserMessage("Trying alternative video format...", 2000);
     vs.src = XR_src_fallback_WEBM;
     video.load();
     recoveryAttempts++;
   } else if (recoveryAttempts === 2 && !video.src.includes('-ultralow')) {
     console.log("Trying low quality fallback");
     showUserMessage("Switching to lower quality video...", 2000);
     vs.src = XR_src_low;
     video.load();
     recoveryAttempts++;
   } else {
     // Show user-friendly error after all automatic recovery attempts
     showErrorMessage(`Video playback error: ${video.error ? video.error.message : 'Unknown error'}`, true);
   }
 });
 
 // ENHANCEMENT: Handle audio errors with better recovery
 audio.addEventListener('error', (e) => {
   console.error('Audio error:', audio.error, e);
   
   // Try fallback audio format if available
   if (recoveryAttempts === 0 && !audio.src.includes('.ogg')) {
     console.log("Trying OGG fallback format for audio");
     showUserMessage("Trying alternative audio format...", 2000);
     audio.innerHTML = `<source src="${audio_src_fallback}" type="audio/ogg">`;
     audio.load();
     recoveryAttempts++;
   } else {
     // Show user-friendly error
     showErrorMessage(`Audio playback error: ${audio.error ? audio.error.message : 'Unknown error'}`, true);
   }
 });
 
 // NEW: Fix for Chrome autoplay policy
 let userInteracted = false;
 
 // Set up user interaction detection
 const markUserInteraction = () => {
   userInteracted = true;
   // Remove listeners once we have interaction
   ['click', 'touchstart', 'keydown'].forEach(eventType => {
     document.removeEventListener(eventType, markUserInteraction);
   });
 };
 
 // Add listeners for user interaction
 ['click', 'touchstart', 'keydown'].forEach(eventType => {
   document.addEventListener(eventType, markUserInteraction);
 });
 
 // ENHANCEMENT: Improved safe play with better feedback
 const safePlayVideo = () => {
   if (!video || !videoReady || video.playing) return Promise.resolve();
   
   // Ensure video is muted for autoplay
   video.muted = true;
   
   // Show attempt message
   showUserMessage("Starting video playback...", 1500);
   
   // Try to play with retry logic
   return video.play()
     .catch(error => {
       console.log('Video play error, retrying:', error);
       
       // If user hasn't interacted yet, show clear message requiring interaction
       if (!userInteracted) {
         console.log('Waiting for user interaction before retrying play');
         showUserMessage("Tap anywhere to enable video playback", 0); // 0 means don't auto-hide
         
         return new Promise(resolve => {
           // Set up one-time listener to retry play after interaction
           const retryPlay = () => {
             // Remove the persistent message
             let messageEl = document.getElementById('userMessage');
             if (messageEl) messageEl.classList.remove('visible');
             
             video.muted = true;
             video.play()
               .then(resolve)
               .catch(e => {
                 console.log('Retry video play failed:', e);
                 showUserMessage("Video playback issue - trying again...", 2000);
               });
             
             // Remove self after one execution
             document.removeEventListener('click', retryPlay);
           };
           
           document.addEventListener('click', retryPlay, { once: true });
         });
       } else {
         // If user has interacted, retry with delay
         return new Promise(resolve => {
           showUserMessage("Retrying video playback...", 1500);
           setTimeout(() => {
             video.muted = true;
             video.play()
               .then(resolve)
               .catch(e => {
                 console.log('Delayed retry failed:', e);
                 showUserMessage("Video playback issues detected", 2000);
               });
           }, 300);
         });
       }
     });
 };

 // Spinner control variables
 let spinnerTimeout = null;
 let spinnerActive = false;
 
 // NEW: Function to ensure spinner is properly centered
 const ensureSpinnerCentered = () => {
   const spinner = $('loadingSpinner');
   if (spinner) {
     // Force re-centering with inline styles
     spinner.style.position = 'fixed';
     spinner.style.top = '50%';
     spinner.style.left = '50%';
     spinner.style.transform = 'translate(-50%, -50%)';
     spinner.style.right = 'auto';
     spinner.style.bottom = 'auto';
     spinner.style.margin = '0';
     spinner.style.zIndex = '999';
     
     // Additional centering fallbacks for broader browser support
     spinner.style.webkitTransform = 'translate(-50%, -50%)';
     spinner.style.mozTransform = 'translate(-50%, -50%)';
     spinner.style.msTransform = 'translate(-50%, -50%)';
     spinner.style.oTransform = 'translate(-50%, -50%)';
     spinner.style.translate = '-50% -50%';
   }
 };

 // Add resize listener to maintain spinner centering
 window.addEventListener('resize', ensureSpinnerCentered);

 // Also call it on DOMContentLoaded
 document.addEventListener('DOMContentLoaded', ensureSpinnerCentered);

 // NEW: Add layout shift detection for more reliable centering
 if ('ResizeObserver' in window) {
   // Create observer to watch for body size changes
   const bodyObserver = new ResizeObserver(() => {
     ensureSpinnerCentered();
   });
   
   // Start observing the body
   document.addEventListener('DOMContentLoaded', () => {
     bodyObserver.observe(document.body);
   });
 }

 // NEW: Watch for layout shifts with MutationObserver
 if ('MutationObserver' in window) {
   const layoutObserver = new MutationObserver((mutations) => {
     // Look for mutations that might affect layout
     const layoutChanging = mutations.some(mutation => 
       mutation.type === 'attributes' && 
       (mutation.attributeName === 'style' || mutation.attributeName === 'class')
     );
     
     if (layoutChanging && spinnerActive) {
       ensureSpinnerCentered();
     }
   });
   
   // Start observing body for attribute changes that could affect layout
   document.addEventListener('DOMContentLoaded', () => {
     layoutObserver.observe(document.body, { 
       attributes: true,
       subtree: true,
       attributeFilter: ['style', 'class']
     });
   });
 }

 // Also ensure centering when orientation changes
 window.addEventListener('orientationchange', () => {
   ensureSpinnerCentered();
   // Re-check after orientation change completes
   setTimeout(ensureSpinnerCentered, 300);
 });

 // Add a global safety timer to ensure spinner is always hidden eventually
 let globalSpinnerSafetyTimer = null;

 // Modified spinner control with centering and safety timeout
 const showSpinner = () => {
   if (spinnerTimeout) {
     clearTimeout(spinnerTimeout);
   }
   
   // Clear any existing safety timer
   if (globalSpinnerSafetyTimer) {
     clearTimeout(globalSpinnerSafetyTimer);
   }
   
   // Set a new safety timer - force hide after 20 seconds no matter what
   globalSpinnerSafetyTimer = setTimeout(() => {
     console.log("Safety timeout triggered - forcing spinner to hide");
     spinner.style.display = 'none';
     spinnerActive = false;
   }, 20000);
   
   if (!spinnerActive) {
     // Ensure proper centering BEFORE showing the spinner
     ensureSpinnerCentered();
     // Now show the spinner
     spinner.style.display = 'flex';
     // Double-check centering after display change
     requestAnimationFrame(ensureSpinnerCentered);
     spinnerActive = true;
   }
 };

 const hideSpinner = () => {
   if (spinnerTimeout) {
     clearTimeout(spinnerTimeout);
   }
   
   // Clear safety timer when deliberately hiding
   if (globalSpinnerSafetyTimer) {
     clearTimeout(globalSpinnerSafetyTimer);
     globalSpinnerSafetyTimer = null;
   }
   
   // Add delay before hiding to prevent flashes
   spinnerTimeout = setTimeout(() => {
     spinner.style.display = 'none';
     spinnerActive = false;
   }, 300);
 };
 
 // Set video source
 vs.src=XR_src;
 video.load();
 
 // Always ensure video is muted regardless of other settings
 video.muted = true;
 
 // Ensure videosphere is visible
 videosphere.setAttribute('visible', 'true');
 
 audio.innerHTML=`<source src="${audio_src}" type="audio/mpeg">`;
 // Apply custom controls to audio element
 audio.controlsList = "nodownload nofullscreen noremoteplayback";

 art.src=thumbnail_src;
 track.textContent=`Chapter ${chapterOrder} – ${chapterName} | ${tourName}`;
 const dot=modeBtn.querySelector('.status-dot');
 
 const updateXrButton=()=>{
   const ready=videoReady&&audioReady;
   modeBtn.classList.toggle('disabled',!ready);
   modeBtn.disabled=!ready;
   dot.style.background=ready?'limegreen':'orange';
 };
 
 const layout=()=>{
   modeBtn.style.display=xrAllowed&&!teaser?'inline-flex':'none';
   recBtn.style.display=xrMode?'inline-block':'none';
   xrModeBtn.style.display=(xrMode&&xrAllowed&&!teaser)?'inline-block':'none';
   chapterNav.style.display=teaser?'none':'flex';
   xrWrap.style.display=(xrMode&&xrAllowed)?'block':'none';
   audioOnly.style.display=(!xrMode||!xrAllowed)?'flex':'none';
   modeBtn.lastChild.textContent=xrMode?' Audio Only':' XR Mode';
   
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

 // NEW: Create an optimized renderer that uses efficient rendering techniques
 const createOptimizedRenderer = () => {
   if (!window.AFRAME || !AFRAME.scenes[0] || !AFRAME.scenes[0].renderer) return;
   
   const renderer = AFRAME.scenes[0].renderer;
   
   // Apply common optimizations
   renderer.setPixelRatio(Math.min(window.devicePixelRatio * PERFORMANCE.pixelRatioScale, 1.5));
   
   if (isMobile) {
     // Mobile-specific optimizations
     renderer.shadowMap.enabled = false;
     renderer.shadowMap.autoUpdate = false;
     renderer.physicallyCorrectLights = false;
     
     // Reduce texture maximum size for mobile
     renderer.capabilities.maxTextureSize = 2048;
     
     // Tell the renderer to prioritize performance over quality
     if (renderer.debug) {
       renderer.debug.checkShaderErrors = false;
     }
     
     // NEW: Set precision to medium for mobile
     if (renderer.capabilities) {
       renderer.capabilities.precision = "mediump";
     }
     
     // Optimize canvas context if possible
     try {
       const gl = renderer.getContext();
       // Hint to the browser that we prefer performance over quality
       gl.hint(gl.GENERATE_MIPMAP_HINT, gl.FASTEST);
       
       // Reduce memory usage for depth and stencil buffers
       const contextAttributes = gl.getContextAttributes();
       if (contextAttributes && gl.getExtension('WEBGL_depth_texture')) {
         // We can reduce depth precision safely for 360 video
         contextAttributes.depth = false;
         contextAttributes.stencil = false;
       }
     } catch (e) {
       console.log("WebGL optimization failed:", e);
     }
   }
   
   return renderer;
 };
 
 // Modify force render function to use requestAnimationFrame and be more efficient
 const forceAFrameRender = () => {
   // Show spinner at the beginning of render attempts
   showSpinner();
   
   if(window.AFRAME && AFRAME.scenes[0] && AFRAME.scenes[0].renderer) {
     console.log("Forcing A-Frame render");
     
     // Create or get optimized renderer
     const renderer = createOptimizedRenderer();
     
     // Explicitly check videosphere visibility
     if(videosphere) {
       videosphere.setAttribute('visible', 'true');
       console.log("Ensuring videosphere visibility");
     }
     
     // NEW: Use requestAnimationFrame instead of setTimeout for more efficient rendering
     if (PERFORMANCE.useRequestAnimationFrame) {
       // Single initial render
       renderer.render(AFRAME.scenes[0].object3D, AFRAME.scenes[0].camera);
       
       // Number of additional renders to attempt
       const numRendersToAttempt = isMobile ? 2 : 4;
       let rendersCompleted = 0;
       
       // Function to perform render in animation frame
       const performRender = () => {
         if (!window.AFRAME || !AFRAME.scenes[0] || !AFRAME.scenes[0].renderer) {
           hideSpinner();
           return;
         }
         
         // Perform render
         renderer.render(AFRAME.scenes[0].object3D, AFRAME.scenes[0].camera);
         
         // Check videosphere visibility
         if (videosphere) {
           videosphere.setAttribute('visible', 'true');
         }
         
         rendersCompleted++;
         
         // Continue rendering if needed
         if (rendersCompleted < numRendersToAttempt) {
           requestAnimationFrame(performRender);
         } else {
           // Hide spinner after all renders complete
           hideSpinner();
         }
       };
       
       // Start render sequence
       requestAnimationFrame(performRender);
     } else {
       // Fallback to setTimeout approach
       renderer.render(AFRAME.scenes[0].object3D, AFRAME.scenes[0].camera);
       window.dispatchEvent(new Event('resize'));
       
       // Schedule multiple renders with increasing delays - use fewer renders on mobile
       const renderDelays = isMobile ? [100, 800] : [100, 400, 800, 1500]; 
       let lastDelay = Math.max(...renderDelays);
       
       renderDelays.forEach(delay => {
         setTimeout(() => {
           if(AFRAME.scenes[0] && AFRAME.scenes[0].renderer) {
             console.log(`Scheduled render at ${delay}ms`);
             AFRAME.scenes[0].renderer.render(AFRAME.scenes[0].object3D, AFRAME.scenes[0].camera);
             
             // Check videosphere visibility again during each render
             if(videosphere) {
               videosphere.setAttribute('visible', 'true');
             }
             
             // Only hide spinner after the last render attempt
             if (delay === lastDelay) {
               hideSpinner();
             }
           }
         }, delay);
       });
     }
   } else {
     // If A-Frame isn't ready, hide spinner after timeout
     setTimeout(hideSpinner, 800);
   }
 };
 
 // Setup observer to detect when container becomes visible
 const containerObserver = new MutationObserver((mutations) => {
   mutations.forEach((mutation) => {
     if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
       const target = mutation.target;
       if (target.style.display === 'block' && target.id === 'xrContainer') {
         console.log("XR container now visible - forcing render");
         forceAFrameRender();
       }
     }
   });
 });
 
 // Start observing the container for visibility changes
 containerObserver.observe(xrWrap, { attributes: true });
 
 // Set initial layout
 layout();
 updateXrButton();

 // Listen for A-Frame scene loaded event
 document.addEventListener('a-scene-loaded', () => {
   console.log("A-Frame scene loaded");
   
   // Get references to A-Frame entities (refresh them)
   scene = document.querySelector('a-scene');
   camera = document.querySelector('[camera]');
   videosphere = document.querySelector('#videosphere');
   
   if (camera) {
     // Store initial camera rotation for reference
     localInitialCameraRotation = {
       x: 0,
       y: 0, // Initial forward view on startup
       z: 0
     };
     
     // Update global reference as well
     initialCameraRotation = { ...localInitialCameraRotation };
     
     // Apply initial camera rotation
     camera.setAttribute('rotation', localInitialCameraRotation);
     console.log("Applied initial camera rotation:", localInitialCameraRotation);
     
     // Set up device-specific controls immediately
     if (!isMobile) {
       // Desktop: set up explicit desktop controls
       setupDesktopCameraControls();
     }
     
     // Store initial videosphere rotation
     if (videosphere) {
       localInitialVideosphereRotation = videosphere.getAttribute('rotation') || {x: 0, y: 0, z: 0};
       initialVideosphereRotation = { ...localInitialVideosphereRotation };
       console.log("Initial videosphere rotation:", localInitialVideosphereRotation);
     }
   }
   
   // Force an initial render now that the scene is loaded
   forceAFrameRender();
 });

 // Add a window load event to force render
 window.addEventListener('load', () => {
   console.log('Window fully loaded, forcing render');
   setTimeout(forceAFrameRender, 200);
 });

 // Video loading events
 video.addEventListener('loadedmetadata', () => {
   console.log("Video metadata loaded");
   
   // Pre-render the frame at time 0 to help with initial display
   if (video.videoWidth && video.videoHeight) {
     try {
       // Create temporary canvas to draw the first frame
       const canvas = document.createElement('canvas');
       canvas.width = video.videoWidth;
       canvas.height = video.videoHeight;
       const ctx = canvas.getContext('2d');
       
       // Draw first frame to help with texture creation
       ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
       
       // Clean up
       setTimeout(() => {
         canvas.width = 1;
         canvas.height = 1;
       }, 1000);
     } catch (e) {
       console.log("Could not pre-render first frame:", e);
     }
   }
   
   // For mobile, apply some optimizations immediately after metadata loads
   if (isMobile) {
     // Lower video quality via video element properties
     video.width = Math.round(1280 * PERFORMANCE.videoScale);
     video.height = Math.round(720 * PERFORMANCE.videoScale);
   }
 });
 
 video.addEventListener('loadeddata',()=>{
  console.log("Video loaded");
  videoReady=true;
  updateXrButton();
  
  // If we're already in XR mode (from Begin button click),
  // attempt to play the video if audio is also playing
  if (xrMode && audioReady && !audio.paused) {
    console.log("Video loaded while in XR mode with audio playing - starting video playback");
    safePlayVideo().catch(e => {
      console.error("Failed to play video after loading:", e);
    });
  }
  
  // Force a render now that video is ready
  if (xrMode) {
    setTimeout(() => {
      forceAFrameRender();
    }, 100);
  }
  
  // Hide spinner if it's still showing
  hideSpinner();
 });
 
 // ENHANCEMENT: Improved buffer monitoring system
 const MAX_BUFFER_WARNINGS = 5; // Increased from 3
 let isRecoveringBuffer = false;
 let consecutiveBufferWarnings = 0;
 let bufferHealthHistory = [];
 
 // Enhanced buffer monitoring function
 const monitorVideoBuffer = () => {
   if (!isMobile || !videoReady || !xrMode) return;
   
   const now = Date.now();
   if (now - lastBufferCheck < 5000) return; // Check every 5 seconds
   lastBufferCheck = now;
   
   if (video.paused) return; // Don't check if paused
   
   try {
     // Get current buffer state
     const buffered = video.buffered;
     let isBufferHealthy = false;
     let bufferAhead = 0;
     
     if (buffered.length > 0) {
       // Check if we have enough buffer ahead
       const currentTime = video.currentTime;
       const bufferedEnd = buffered.end(buffered.length - 1);
       bufferAhead = bufferedEnd - currentTime;
       
       console.log(`Buffer status: ${bufferAhead.toFixed(2)}s ahead of current playback`);
       
       // Track buffer health history for trend analysis
       bufferHealthHistory.push(bufferAhead);
       if (bufferHealthHistory.length > 5) {
         bufferHealthHistory.shift(); // Keep last 5 readings
       }
       
       // Consider buffer healthy if we have at least 10 seconds ahead
       isBufferHealthy = bufferAhead >= 10;
     }
     
     if (!isBufferHealthy && !isRecoveringBuffer) {
       bufferWarnings++;
       consecutiveBufferWarnings++;
       console.log(`Buffer warning ${bufferWarnings}/${MAX_BUFFER_WARNINGS}, consecutive: ${consecutiveBufferWarnings}`);
       
       // Show user feedback if buffer is getting low
       if (bufferAhead < 3) {
         showUserMessage("Buffering video...", 2000);
       }
       
       // Check if buffer health is trending downward
       let isBufferDeclining = false;
       if (bufferHealthHistory.length >= 3) {
         const recentReadings = bufferHealthHistory.slice(-3);
         isBufferDeclining = recentReadings[0] > recentReadings[1] && recentReadings[1] > recentReadings[2];
       }
       
       // Trigger recovery if:
       // 1. We've hit max warnings, or
       // 2. Buffer is critically low (<2s) and declining, or
       // 3. We've had multiple consecutive warnings
       if (bufferWarnings >= MAX_BUFFER_WARNINGS || 
           (bufferAhead < 2 && isBufferDeclining) || 
           consecutiveBufferWarnings >= 3) {
         console.log("Buffer critically low, attempting recovery");
         attemptBufferRecovery();
       }
     } else if (isBufferHealthy) {
       // Reset warning count if buffer is healthy
       consecutiveBufferWarnings = 0;
       
       // Only reset total warnings if we have a very healthy buffer
       if (bufferAhead > 20) {
         bufferWarnings = Math.max(0, bufferWarnings - 1); // Gradually reduce warnings
       }
     }
     
     // ENHANCEMENT: Check network quality if buffer is consistently low
     if (consecutiveBufferWarnings >= 2) {
       // Force a network quality check
       checkNetworkQuality();
     }
   } catch (e) {
     console.log("Buffer monitoring error:", e);
   }
 };
 
 // ENHANCEMENT: Improved buffer recovery with fallback strategies
 const attemptBufferRecovery = () => {
   if (isRecoveringBuffer) return;
   isRecoveringBuffer = true;
   
   console.log("Starting buffer recovery process");
   showSpinner();
   showUserMessage("Buffering content...", 3000);
   
   // Store current playback state
   const currentTime = video.currentTime;
   const wasPlaying = !video.paused;
   
   // Pause video to allow buffer to build up
   if (wasPlaying) {
     video.pause();
   }
   
   // Try different recovery strategies based on warning count
   if (bufferWarnings >= MAX_BUFFER_WARNINGS) {
     // Severe buffering issues - consider quality downgrade
     if (networkQuality !== "low" && !video.src.includes("-ultralow")) {
       console.log("Severe buffering issues - attempting quality downgrade");
       showUserMessage("Adjusting video quality for smoother playback", 3000);
       
       // Switch to lower quality video
       switchToLowerQualityVideo();
       
       // Reset counters
       bufferWarnings = 0;
       consecutiveBufferWarnings = 0;
       bufferHealthHistory = [];
       isRecoveringBuffer = false;
       return;
     }
   }
   
   // Standard recovery approach - seek back and pause to buffer
   // Set to a slightly earlier time to help rebuffer
   const seekBackTime = Math.max(0, currentTime - 2);
   video.currentTime = seekBackTime;
   
   // Give it some time to buffer - longer for worse conditions
   const bufferTime = networkQuality === "low" ? 5000 : 
                     networkQuality === "medium" ? 3000 : 2000;
   
   setTimeout(() => {
     hideSpinner();
     
     if (wasPlaying) {
       // Resume playback
       video.play().catch(e => {
         console.log("Recovery resume error:", e);
         showUserMessage("Playback recovery issues detected", 2000);
       });
     }
     
     // Reset recovery state but maintain warnings
     isRecoveringBuffer = false;
     consecutiveBufferWarnings = Math.max(0, consecutiveBufferWarnings - 1);
   }, bufferTime);
 };
 
 // Set up more frequent buffer monitoring for mobile
 let bufferMonitorInterval = null;
 if (isMobile) {
   bufferMonitorInterval = setInterval(monitorVideoBuffer, 3000); // More frequent checks (was 5000)
 }

 // ENHANCEMENT: Improved recenter function with user feedback - moved inside DOMContentLoaded scope
 function recenter(){
   // Get fresh references to ensure we're using the latest elements
   const camera = document.querySelector('[camera]');
   const videosphere = document.querySelector('#videosphere');
   
   if(!camera || !window.AFRAME) {
     console.error("Cannot recenter: camera or AFRAME not available");
     return;
   }
   
   // Show feedback based on device type
   showUserMessage(isMobile ? "Recentering view based on device orientation" : "Resetting camera view", 1500);
   
   console.log("Recenter called, camera:", camera, "initialRotation:", localInitialCameraRotation);
   
   // Check if we're on mobile
   if (isMobile) {
     try {
       // Check if device orientation is enabled/available
       const hasOrientation = window.deviceOrientationEnabled !== false;
       
       // Helper function for mobile fallback recentering
       function mobileFallbackRecenter() {
         console.log("Using fallback recenter method for mobile");
         const currentY = camera.getAttribute('rotation').y || 0;
         
         // Updated approach: Set current direction as the new "front" view (0,0,0)
         // Step 1: Set videosphere rotation to current camera Y rotation
         videosphere.setAttribute('rotation', {
           x: 0,
           y: currentY,
           z: 0
         });
         
         // Step 2: Reset camera rotation to 0,0,0
         camera.setAttribute('rotation', {x: 0, y: 0, z: 0});
         
         // Step 3: Update stored reference points
         localInitialCameraRotation = {x: 0, y: 0, z: 0};
         localInitialVideosphereRotation = {x: 0, y: currentY, z: 0};
         
         console.log(`Recentered on mobile: Made current view (camera Y = ${currentY}) the new front direction (0,0,0)`);
         
         // Force immediate render
         forceAFrameRender();
       }
       
       if (hasOrientation) {
         // For mobile with orientation enabled, adjusting the videosphere is the most reliable way to recenter
         
         // First, get current device orientation if available
         let deviceAlpha = 0;
         let orientationCaptured = false;
         let orientationTimeoutId = null;
         
         // Set timeout first to ensure it runs if no event occurs
         orientationTimeoutId = setTimeout(() => {
           if (!orientationCaptured) {
             console.log("No device orientation event captured within timeout, using fallback");
             window.removeEventListener('deviceorientation', orientationHandler);
             mobileFallbackRecenter();
           }
         }, 200);
         
         function orientationHandler(event) {
           if (event.alpha !== null) {
             deviceAlpha = event.alpha;
             orientationCaptured = true;
           }
           window.removeEventListener('deviceorientation', orientationHandler);
           clearTimeout(orientationTimeoutId);
           
           if (orientationCaptured) {
             // Get current camera Y rotation
             const currentY = camera.getAttribute('rotation').y || 0;
             
             // Updated approach: Set current direction as the new "front" view (0,0,0)
             // Step 1: Set videosphere rotation to current camera Y rotation
             videosphere.setAttribute('rotation', {
               x: 0,
               y: currentY,
               z: 0
             });
             
             // Step 2: Reset camera rotation to 0,0,0
             camera.setAttribute('rotation', {x: 0, y: 0, z: 0});
             
             // Step 3: Update stored reference points
             localInitialCameraRotation = {x: 0, y: 0, z: 0};
             localInitialVideosphereRotation = {x: 0, y: currentY, z: 0};
             
             console.log(`Recentered on mobile: Made current view (camera Y = ${currentY}) the new front direction (0,0,0)`);
             
             // Force immediate render
             forceAFrameRender();
           } else {
             // Use camera rotation method as fallback if orientation data is null
             mobileFallbackRecenter();
           }
         }
         
         window.addEventListener('deviceorientation', orientationHandler, { once: true });
       } else {
         // If device orientation is disabled/unavailable, use the fallback method
         mobileFallbackRecenter();
       }
     } catch (e) {
       console.error("Error during mobile recenter:", e);
       showUserMessage("Recenter encountered an error", 1500);
     }
   } else {
     // Desktop approach - reset the camera to its initial rotation values exactly
     // This simulates "returning home" in the 360 viewport
     camera.setAttribute('position', {x: 0, y: 1.6, z: 0});
     camera.setAttribute('rotation', {
       x: localInitialCameraRotation.x,
       y: localInitialCameraRotation.y, // Should be 0 degrees to match videosphere
       z: localInitialCameraRotation.z
     });
     
     console.log("Recentered on desktop: reset to initial camera rotation", localInitialCameraRotation);
     
     // Force A-Frame to update the camera view
     if (AFRAME.scenes[0] && AFRAME.scenes[0].camera) {
       AFRAME.scenes[0].camera.updateMatrixWorld();
     }
     
     // Force immediate render
     forceAFrameRender();
   }
 }
 
 audio.addEventListener('loadeddata',()=>{
   console.log("Audio loaded");
   audioReady=true;
   updateXrButton();
   
   // Check if A-Frame is initialized before attempting to recenter
   if (window.AFRAME && AFRAME.scenes[0] && AFRAME.scenes[0].hasLoaded) {
     console.log("A-Frame scene is loaded, safe to recenter");
     if (typeof window.recenterCamera === 'function') { 
       window.recenterCamera(); 
     } else { 
       console.error('recenterCamera not found on audio load'); 
     }
   } else {
     console.log("A-Frame scene not ready yet, will recenter when loaded");
     // Wait for A-Frame to load before attempting to recenter
     const recenterWhenReady = () => {
       console.log("A-Frame scene now loaded, recentering camera");
       if (typeof window.recenterCamera === 'function') {
         window.recenterCamera();
       }
       document.removeEventListener('a-scene-loaded', recenterWhenReady);
     };
     document.addEventListener('a-scene-loaded', recenterWhenReady);
   }
   
   // Do not toggle XR mode here - it should be controlled by the begin button
   // xrMode=!xrMode;  // <- This line was causing problems
   
   // Update layout with current state
   layout();
   
   // If video is ready and playing, sync it with audio
   if (xrMode && videoReady && !video.paused && !audio.paused) {
     video.currentTime = audio.currentTime;
   }
   
   // Hide spinner if it's still showing
   hideSpinner();
 });
 
 // Playback events
 audio.addEventListener('play',()=>{
   if(xrMode && videoReady && video.paused){
     // Use safer video play approach
     safePlayVideo().catch(e => {
       console.error("Failed to play video after audio play:", e);
       // Fall back to simple approach if safe play fails
       video.muted = true;
       video.currentTime = audio.currentTime;
       video.play().catch(err => console.error("Fallback play also failed:", err));
     });
   }
   
   // Initialize XR rendering when playback starts
   if(xrMode && window.AFRAME) {
     forceAFrameRender();
   }
   
   // Set up sync interval when playback starts
   setupSyncInterval();
 });
 
 audio.addEventListener('pause',()=>{
   if(!video.paused)video.pause();
 });
 
 // Time update event for CTA overlay
 audio.addEventListener('timeupdate',()=>{
   // Only show CTA overlay if we're in teaser mode, it's not already shown, 
   // and we've reached the specified time
   if(teaser && !overlayShown && audio.currentTime >= outroCTA_time){
     overlay.style.display = 'flex';
     overlayShown = true;
   }
 });
 
 modeBtn.addEventListener('click',()=>{
   if(modeBtn.classList.contains('disabled'))return;
   
   // Store the current play state and time to restore after mode change
   const wasPlaying = !audio.paused;
   const currentTime = audio.currentTime;
   
   // No need to pause - this was causing the interruption
   
   if (typeof window.recenterCamera === 'function') { window.recenterCamera(); } else { console.error('recenterCamera not found on mode button click'); }
   xrMode=!xrMode;
   layout();
   
   // Short timeout to let the DOM update before adjusting playback
   setTimeout(() => {
     // Always resync time after mode change
     if (xrMode && videoReady) {
       // Set video time without interrupting playback
       video.currentTime = currentTime;
       
       // Set up new sync interval with optimized function
       if (typeof setupSyncInterval === 'function') {
         setupSyncInterval();
       }
       
       // If audio is playing, also make sure video is playing
       if (wasPlaying) {
         video.muted = true;
         video.play().catch((e) => {
           console.error("Mode toggle play error:", e);
           setTimeout(() => video.play().catch(e => console.error("Retry play failed:", e)), 500);
         });
       }
     }
   }, 50);
 });
 
 recBtn.addEventListener('click', function(e) {
   console.log("Recenter button clicked");
   
   // Use the global recenterCamera function which uses the component
   if (typeof window.recenterCamera === 'function') {
     window.recenterCamera();
   } else if (typeof window.recenterCameraFromAFrame === 'function') {
     // Fallback to direct component function
     console.log("Using fallback recenterCameraFromAFrame");
     window.recenterCameraFromAFrame();
   } else {
     console.error("No recenter camera functions available. Check component initialization.");
   }
   
   // Optional: Add a delayed check to see if the rotation was actually changed for debugging
   setTimeout(() => {
     const updatedCamera = document.querySelector('#cameraEntity'); // Use ID for consistency
     if (updatedCamera) {
        const rotation = updatedCamera.getAttribute('rotation');
        console.log("Camera rotation after recenter attempt:", rotation);
     } else {
        console.log("Could not find camera #cameraEntity after recenter for debug check.");
     }
   }, 100);
 });
 overlay.addEventListener('click',()=> {
   overlay.style.setProperty('display', 'none', 'important');
   overlayShown = false;
 });
 ctaBox.addEventListener('click',e=>{
   e.stopPropagation();
   window.location.href=outroCTA_backlink
 });
 
 if(!devToggleAllowed)devBtn.style.display='none';
 
 devBtn.addEventListener('click',()=>{
   teaser=!teaser;
   overlay.style.setProperty('display', 'none', 'important');
   overlayShown=false;
   xrAllowed=isXR||teaser;
   
   // Don't force XR mode when enabling teaser, respect current mode
   if (teaser) {
     showUserMessage("Teaser mode enabled", 1500);
   } else {
     showUserMessage("Teaser mode disabled", 1500);
   }
   
   layout();
 });
 
 // Handle chapter navigation
 $('prevChapter').addEventListener('click', () => {
   // You could implement chapter navigation logic here
   console.log("Previous chapter");
 });
 
 $('nextChapter').addEventListener('click', () => {
   // You could implement chapter navigation logic here
   console.log("Next chapter");
 });
 
 begin.addEventListener('click',async()=>{
   // Prevent double-clicks and ensure button is only pressed once
   if (begin.disabled) return;
   begin.disabled = true;
   
   // Hide landing overlay immediately to provide user feedback
   landing.style.display='none';
   
   // Show spinner while initializing
   showSpinner();
   
   // Set XR mode to true immediately so the layout renders correctly
   xrMode = true;
   
   // Configure video quality based on device capabilities
   configureVideoForDevice();
   
   // Update layout with current XR mode status
   layout();
   
   // Special handling for iOS Safari - delay before checking for permissions to fix iOS Safari issues
   // This helps overcome timing issues on iPhones where permission dialogs can get stuck
   if(deviceCapabilities.isIOSSafari) {
     console.log("iOS Safari detected, using special permission handling flow");
     showUserMessage("Initializing tour...", 2000);
     
     // Wait for a longer delay before proceeding on iOS Safari specifically
     await new Promise(resolve => setTimeout(resolve, 800));
   } else if(deviceCapabilities.isAppleDevice) {
     console.log("iOS device detected, using standard iOS flow");
     showUserMessage("Initializing tour...", 2000);
     
     // Wait for a small delay before proceeding on other iOS browsers
     await new Promise(resolve => setTimeout(resolve, 500));
   }
   
   // Request device orientation permission only on supported mobile devices
   let permissionPromise = Promise.resolve(); // Default to resolved promise
   
   if(isMobile && typeof DeviceOrientationEvent !== 'undefined'){
     if (DeviceOrientationEvent.requestPermission && typeof DeviceOrientationEvent.requestPermission === 'function') {
       try {
         showUserMessage("Requesting device motion access...", 2000);
         
         // On iOS, use a simpler approach to request permissions with proper error handling
         try {
           const permissionState = await DeviceOrientationEvent.requestPermission();
           
           if (permissionState === 'granted') {
             showUserMessage("Device motion access granted", 1500);
             window.deviceOrientationEnabled = true;
             setupMobileOrientationControls();
           } else {
             showUserMessage("Using touch controls instead", 2000);
             window.deviceOrientationEnabled = false;
             window.deviceOrientationDenied = true;
             setupMobileFallbackControls();
           }
         } catch(permissionError) {
           console.error("Permission request error:", permissionError);
           showUserMessage("Using touch controls", 2000);
           window.deviceOrientationEnabled = false;
           window.deviceOrientationError = true;
           setupMobileFallbackControls();
         }
       } catch(e) {
         console.error("Error in device orientation permission flow:", e);
         window.deviceOrientationEnabled = false;
         setupMobileFallbackControls();
         showUserMessage("Using touch controls", 1500);
       }
     } else {
       // Non-iOS mobile devices
       console.log("Device orientation available without explicit permission");
       window.deviceOrientationEnabled = true;
       
       // Check if orientation events are actually firing
       let orientationEventDetected = false;
       
       const detectOrientation = (event) => {
         if (event.alpha !== null || event.beta !== null || event.gamma !== null) {
           orientationEventDetected = true;
           window.removeEventListener('deviceorientation', detectOrientation);
           console.log("Device orientation events confirmed");
           setupMobileOrientationControls();
         }
       };
       
       window.addEventListener('deviceorientation', detectOrientation);
       
       // For non-iOS devices that don't have orientation events
       setTimeout(() => {
         if (!orientationEventDetected) {
           console.log("No device orientation events detected, falling back to touch");
           window.deviceOrientationEnabled = false;
           setupMobileFallbackControls();
           showUserMessage("Using touch controls", 2000);
         }
       }, 1000);
     }
   } else if (isMobile) {
     // Mobile device without orientation API
     console.log("DeviceOrientationEvent API not available on this mobile device");
     window.deviceOrientationEnabled = false;
     setupMobileFallbackControls();
     showUserMessage("Using touch controls", 2000);
   } else {
     // Desktop device
     setupDesktopCameraControls();
     showUserMessage("Using mouse controls", 2000);
   }
   
   // Force a render to update the scene with new settings
   if(window.AFRAME && AFRAME.scenes[0]) {
     setTimeout(() => {
       window.dispatchEvent(new Event('resize'));
       if(AFRAME.scenes[0].renderer) {
         AFRAME.scenes[0].renderer.render(AFRAME.scenes[0].object3D, AFRAME.scenes[0].camera);
       }
     }, 200);
   }
   
   // Proceed with media loading
   try {
     // Load audio first
     audio.load();
     showUserMessage("Loading audio...", 1500);
     
     // For mobile, try to play muted video to bypass autoplay restrictions
     if(isMobile && videoReady) {
       video.muted = true;
       video.play().catch(e => console.log("Initial video play attempt:", e));
     }
     
     // On iOS, we need to ensure user interaction for audio playback
     if(deviceCapabilities.isAppleDevice) {
       showUserMessage("Tap screen to start audio", 0); // Persistent message
       
       // Create a one-time tap handler for iOS
       const iosTapHandler = () => {
         document.removeEventListener('click', iosTapHandler);
         document.removeEventListener('touchend', iosTapHandler);
         
         // Clear persistent message
         let messageEl = document.getElementById('userMessage');
         if (messageEl) messageEl.classList.remove('visible');
         
         // Try to play audio
         audio.play().catch(err => {
           console.error("iOS audio play error:", err);
           showUserMessage("Tap again for audio", 0);
         });
       };
       
       document.addEventListener('click', iosTapHandler, { once: true });
       document.addEventListener('touchend', iosTapHandler, { once: true });
     } else {
       // Non-iOS devices can try to play audio directly
       try {
         await audio.play();
         showUserMessage("Playback started", 1500);
       } catch(e) {
         console.error("Audio play error:", e);
         showUserMessage("Tap to start audio", 0); // Persistent message
         
         // Create one-time click handler to retry audio
         document.addEventListener('click', function retryAudio() {
           audio.play().catch(err => console.error("Retry audio play failed:", err));
           
           // Remove message and listener
           let messageEl = document.getElementById('userMessage');
           if (messageEl) messageEl.classList.remove('visible');
           document.removeEventListener('click', retryAudio);
         }, { once: true });
       }
     }
   } catch(e) {
     console.error("Media loading error:", e);
   } finally {
     // Always hide spinner to prevent it getting stuck
     hideSpinner();
     
     // Re-enable the button after a delay in case user goes back
     setTimeout(() => {
       begin.disabled = false;
     }, 2000);
   }
   
   // Ensure spinner is hidden after a maximum timeout
   setTimeout(() => {
     hideSpinner();
   }, 8000);
 });
 
 xrModeBtn.addEventListener('click', () => {
   if(teaser) return;
   
   // Store the current play state and time
   const wasPlaying = !audio.paused;
   const currentTime = audio.currentTime;
   
   // No need to pause - just switch modes directly
   
   if (typeof window.recenterCamera === 'function') { window.recenterCamera(); } else { console.error('recenterCamera not found on XR toggle mode button click'); }
   xrMode = false;
   layout();
   
   // Short timeout to let the DOM update before continuing
   setTimeout(() => {
     // Nothing else needed here as audio continues playing
   }, 50);
 });

 // Replace the local setupSyncInterval function with a proper call to the imported one
 let syncInterval;
 const setupSyncInterval = () => {
   if (syncInterval) clearInterval(syncInterval);
   
   // Call the proper implementation from videoManager
   syncInterval = videoManagerSyncInterval(video, audio, videoReady, xrMode);
   
   return syncInterval;
 };
});

// Optimize the THREE.js video texture handling for mobile
document.addEventListener('aframeinitialized', function() {
  console.log("A-Frame initialized");
  
  const videosphere = document.getElementById('videosphere');
  if(videosphere) {
    videosphere.setAttribute('visible', 'true');
    console.log("Set videosphere visible on A-Frame init");
    
    // Add explicit texture optimization for the videosphere
    try {
      const material = videosphere.getObject3D('mesh').material;
      if (material && material.map) {
        // Apply optimized texture settings for better performance
        material.map.minFilter = THREE.LinearFilter;
        material.map.magFilter = THREE.LinearFilter;
        material.map.generateMipmaps = false;
        
        // NEW: Use lower memory texture format when possible on mobile
        if (PERFORMANCE.useLowerBitDepthTextures && window.THREE) {
          material.map.format = THREE.RGBFormat; // Use RGB instead of RGBA
          material.map.type = THREE.UnsignedByteType; // Use 8-bit per channel
        }
        
        // NEW: Optimize texture wrapping to avoid wasted calculations
        material.map.wrapS = THREE.ClampToEdgeWrapping;
        material.map.wrapT = THREE.ClampToEdgeWrapping;
        
        // NEW: Set anisotropy to minimum
        material.map.anisotropy = 1;
        
        // Apply the changes
        material.map.needsUpdate = true;          
        material.needsUpdate = true;
        console.log("Applied texture optimizations to videosphere");
      }
    } catch (e) {
      console.log("Could not apply texture optimizations:", e);
    }
  }
  
  // NEW: Set a lower quality renderer for better performance
  if (AFRAME.scenes[0] && AFRAME.scenes[0].renderer) {
    const renderer = AFRAME.scenes[0].renderer;
    
    if (isMobile) {
      // Reduce pixel ratio for mobile
      renderer.setPixelRatio(Math.min(window.devicePixelRatio * PERFORMANCE.pixelRatioScale, 1.0));
      
      // Apply mobile-specific optimizations
      renderer.shadowMap.enabled = false;
      renderer.physicallyCorrectLights = false;
      
      try {
        // Get WebGL context for lower-level optimizations
        const gl = renderer.getContext();
        
        // Tell WebGL to optimize for performance, not quality
        gl.hint(gl.GENERATE_MIPMAP_HINT, gl.FASTEST);
        
        // Use lower precision on mobile
        if (renderer.capabilities) {
          renderer.capabilities.precision = "mediump";
        }
        
        // Disable depth testing since we only have a videosphere
        gl.disable(gl.DEPTH_TEST);
        
        // Disable anti-aliasing for better performance
        gl.disable(gl.SAMPLE_COVERAGE);
        gl.disable(gl.SAMPLE_ALPHA_TO_COVERAGE);
      } catch (e) {
        console.log("Advanced WebGL optimization failed:", e);
      }
    }
  }
  
  // Add inertia to camera controls
  const cameraEntity = document.getElementById('cameraEntity');
  if (cameraEntity) {
    // Get current look-controls component
    const lookControlsComponent = cameraEntity.getAttribute('look-controls');
    
    // Add inertia parameters to look-controls
    const updatedLookControls = {
      ...lookControlsComponent,
      smoothingFactor: 0.15, // Lower value = more inertia
      smoothingEnabled: true
    };
    
    // Update the component with new settings
    cameraEntity.setAttribute('look-controls', updatedLookControls);
    
    console.log("Added inertia to camera controls");
  }
});

// Clean up resources properly when page is unloaded
window.addEventListener('beforeunload', () => {
  // Clear all intervals
  if (syncInterval) clearInterval(syncInterval);
  if (bufferMonitorInterval) clearInterval(bufferMonitorInterval);
  
  // Release video resources explicitly
  if (video) {
    video.pause();
    video.src = '';
    video.load();
  }
  
  // Release audio resources explicitly
  if (audio) {
    audio.pause();
    audio.src = '';
    audio.load();
  }
}); 

// Add a direct handler for the begin-tour-clicked event to handle potential module loading issues
window.addEventListener('begin-tour-clicked', function() {
  console.log("Begin tour custom event received");
  // Try to simulate the begin button click if it didn't work through normal paths
  const begin = document.getElementById('beginBtn');
  if (begin && typeof window.startTour !== 'function') {
    // Create a global startTour function that can be called directly
    window.startTour = async function() {
      console.log("Starting tour via global function");
      const landing = document.getElementById('landingOverlay');
      const spinner = document.getElementById('loadingSpinner');
      
      // Hide landing and show spinner
      if (landing) landing.style.display = 'none';
      if (spinner) spinner.style.display = 'flex';
      
      // Set up audio playback
      const audio = document.getElementById('audioPlayer');
      if (audio) {
        try {
          await audio.play();
        } catch(e) {
          console.error("Audio play error via fallback handler:", e);
          // Add click handler to body to try again on user interaction
          document.body.addEventListener('click', function bodyClickHandler() {
            audio.play().catch(err => console.error("Retry audio play failed:", err));
            document.body.removeEventListener('click', bodyClickHandler);
          }, { once: true });
        }
      }
      
      // Hide spinner after a delay
      setTimeout(() => {
        if (spinner) spinner.style.display = 'none';
      }, 2000);
    };
    
    // Execute the tour start function
    window.startTour();
  }
});