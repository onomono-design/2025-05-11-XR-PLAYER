// Configuration constants
const XR_src = "https://cmm-cloud-2.s3.us-west-1.amazonaws.com/WALKING+TOURS/2025-04-10-JAPANTOWN-XR/2025-04-21-CHINATOWN-XR-UPDATE/2025-04-21-CHINATOWN-XR-2b-low.mp4";
const XR_src_fallback_HLS = "https://cmm-cloud-2.s3.us-west-1.amazonaws.com/WALKING+TOURS/2025-04-10-JAPANTOWN-XR/2025-04-21-CHINATOWN-XR-UPDATE/2025-04-21-CHINATOWN-XR-2b-low.m3u8";
const XR_src_fallback_WEBM = "https://cmm-cloud-2.s3.us-west-1.amazonaws.com/WALKING+TOURS/2025-04-10-JAPANTOWN-XR/2025-04-21-CHINATOWN-XR-UPDATE/2025-04-21-CHINATOWN-XR-2b-low.webm";
const XR_src_low = "https://cmm-cloud-2.s3.us-west-1.amazonaws.com/WALKING+TOURS/2025-04-10-JAPANTOWN-XR/2025-04-21-CHINATOWN-XR-UPDATE/2025-04-21-CHINATOWN-XR-2b-ultralow.mp4";
const audio_src = "https://cmm-cloud-2.s3.us-west-1.amazonaws.com/WALKING+TOURS/2025-03-15-CHINATOWN/2025-03-15-CHINATOWN-MP3S/2025-04-21-SHORTER-MP3-CHAPTERS/2025-04-21-Chapter+2+Look+Tin+Eli.mp3";
const audio_src_fallback = "https://cmm-cloud-2.s3.us-west-1.amazonaws.com/WALKING+TOURS/2025-03-15-CHINATOWN/2025-03-15-CHINATOWN-MP3S/2025-04-21-SHORTER-MP3-CHAPTERS/2025-04-21-Chapter+2+Look+Tin+Eli.ogg";
const thumbnail_src = "https://placehold.co/1024x1024/1E1E1E/FFFFFF?text=Album+Art";
const chapterName = "Look Tin Eli";
const chapterOrder = 2;
const tourName = "Chinatown Tour";
const isXR = true;
const isTeaser = false;
const outroCTA_time = 20;
const outroCTA_backlink = "https://example.com/full-tour";
const devToggleAllowed = true;
const isMobile = matchMedia('(pointer:coarse)').matches;

// More reliable device detection
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
             (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = /Android/.test(navigator.userAgent);
const isTouchDevice = isMobile || isIOS || isAndroid || ('ontouchstart' in window);

// PERFORMANCE IMPROVEMENT: More aggressive performance settings for better framerate
const PERFORMANCE = {
  // Lower is better for performance, higher for quality
  // Reduced for better frame rate
  textureQuality: isMobile ? 0.4 : 0.8, // Reduced from 0.5/1.0
  
  useProgressiveLoading: true,
  
  // Controls how aggressively we downscale video
  // PERFORMANCE IMPROVEMENT: More aggressive scaling on mobile
  videoScale: isMobile ? 0.5 : 0.9, // Reduced from 0.6/1.0
  
  // How much to reduce pixel ratio on mobile
  // PERFORMANCE IMPROVEMENT: More aggressive pixel ratio reduction
  pixelRatioScale: isMobile ? 0.6 : 0.9, // Reduced from 0.7/1.0
  
  // Buffer size for mobile (in seconds)
  mobileBufferSize: 30,
  
  // Maximum sync operations per second
  // PERFORMANCE IMPROVEMENT: Less frequent syncing for better framerate
  maxSyncFrequency: isMobile ? 0.5 : 2, // Reduced from 1/4 (one sync every 2 seconds on mobile)
  
  // Use RAF instead of setTimeout for renders
  useRequestAnimationFrame: true,
  
  // Only sync when difference exceeds this threshold (in seconds)
  // PERFORMANCE IMPROVEMENT: More tolerant sync threshold
  syncThreshold: isMobile ? 1.0 : 0.3, // Increased from 0.75/0.2
  
  // Predictive sync (use audio playback rate instead of seeking)
  usePredictiveSync: true, // Changed from isMobile to true for both
  
  // PERFORMANCE IMPROVEMENT: New settings to improve framerate
  // Skip frames to maintain performance when needed
  allowFrameSkipping: isMobile,
  
  // Prioritize framerate over sync accuracy
  prioritizeFramerate: true,
  
  // Apply hardware acceleration where possible
  useHardwareAcceleration: true,
  
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

// Media cache configuration for service worker
const MEDIA_URLS = [
  XR_src,
  XR_src_fallback_HLS,
  XR_src_fallback_WEBM,
  XR_src_low,
  audio_src,
  audio_src_fallback
];

export {
  XR_src,
  XR_src_fallback_HLS,
  XR_src_fallback_WEBM,
  XR_src_low,
  audio_src,
  audio_src_fallback,
  thumbnail_src,
  chapterName,
  chapterOrder,
  tourName,
  isXR,
  isTeaser,
  outroCTA_time,
  outroCTA_backlink,
  devToggleAllowed,
  isMobile,
  isIOS,
  isAndroid,
  isTouchDevice,
  PERFORMANCE,
  MEDIA_URLS
}; 