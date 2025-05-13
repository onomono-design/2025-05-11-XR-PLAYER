import { isMobile, PERFORMANCE } from './config.js';

// DOM helper function
const $ = id => document.getElementById(id);

// Spinner control variables and functions
let spinnerTimeout = null;
let spinnerActive = false;

const showSpinner = () => {
  if (spinnerTimeout) {
    clearTimeout(spinnerTimeout);
  }
  if (!spinnerActive) {
    $('loadingSpinner').style.display = 'flex';
    spinnerActive = true;
  }
};

const hideSpinner = () => {
  if (spinnerTimeout) {
    clearTimeout(spinnerTimeout);
  }
  // Add delay before hiding to prevent flashes
  spinnerTimeout = setTimeout(() => {
    $('loadingSpinner').style.display = 'none';
    spinnerActive = false;
  }, 300);
};

// Clean up resources properly when page is unloaded
const setupCleanup = (video, audio, syncInterval, bufferMonitorInterval) => {
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
};

export {
  $,
  showSpinner,
  hideSpinner,
  setupCleanup
}; 