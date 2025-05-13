// Configuration constants
const XR_src = "https://cmm-cloud-2.s3.us-west-1.amazonaws.com/WALKING+TOURS/2025-04-10-JAPANTOWN-XR/2025-04-21-CHINATOWN-XR-UPDATE/2025-04-21-CHINATOWN-XR-2b-low.mp4";
const audio_src = "https://cmm-cloud-2.s3.us-west-1.amazonaws.com/WALKING+TOURS/2025-03-15-CHINATOWN/2025-03-15-CHINATOWN-MP3S/2025-04-21-SHORTER-MP3-CHAPTERS/2025-04-21-Chapter+2+Look+Tin+Eli.mp3";
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
  usePredictiveSync: isMobile,
  
  // PERFORMANCE IMPROVEMENT: New settings to improve framerate
  // Skip frames to maintain performance when needed
  allowFrameSkipping: isMobile,
  
  // Prioritize framerate over sync accuracy
  prioritizeFramerate: true,
  
  // Apply hardware acceleration where possible
  useHardwareAcceleration: true
};

export {
  XR_src,
  audio_src,
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
  PERFORMANCE
}; 