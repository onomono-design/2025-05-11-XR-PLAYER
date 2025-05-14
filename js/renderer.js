import { isMobile, PERFORMANCE } from './config.js';
import { $, showSpinner, hideSpinner } from './utils.js';

// PERFORMANCE IMPROVEMENT: More aggressive renderer optimizations
const createOptimizedRenderer = () => {
  if (!window.AFRAME || !AFRAME.scenes[0] || !AFRAME.scenes[0].renderer) return;
  
  const renderer = AFRAME.scenes[0].renderer;
  
  // Apply common optimizations
  // PERFORMANCE FIX: Reduce pixel ratio more aggressively
  renderer.setPixelRatio(Math.min(window.devicePixelRatio * PERFORMANCE.pixelRatioScale, isMobile ? 1.2 : 1.5));
  
  // PERFORMANCE IMPROVEMENT: Added for both mobile and desktop
  renderer.sortObjects = false; // Disable object sorting for 360 video
  
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
    
    // Set precision to medium for mobile
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
      
      // PERFORMANCE IMPROVEMENT: Disable anti-aliasing on mobile (if possible post-creation)
      try {
        gl.disable(gl.MULTISAMPLE);
      } catch (e) {
        // Ignore if not supported
      }
    } catch (e) {
      console.log("WebGL optimization failed:", e);
    }
  } else {
    // PERFORMANCE IMPROVEMENT: Desktop-specific optimizations
    if (renderer.info && renderer.info.autoReset) {
      // Avoid collecting render stats which can cause performance issues
      renderer.info.autoReset = false;
    }
    
    try {
      // Optimize canvas context for desktop too
      const gl = renderer.getContext();
      // Use faster WebGL hints
      gl.hint(gl.GENERATE_MIPMAP_HINT, gl.FASTEST);
    } catch (e) {
      // Ignore if not supported
    }
  }
  
  return renderer;
};

// PERFORMANCE IMPROVEMENT: Simplified render function with fewer renders
const forceAFrameRender = () => {
  // Show spinner at the beginning of render attempts
  showSpinner();
  
  const videosphere = $('videosphere');
  
  if(window.AFRAME && AFRAME.scenes[0] && AFRAME.scenes[0].renderer) {
    console.log("Forcing A-Frame render");
    
    // Create or get optimized renderer
    const renderer = createOptimizedRenderer();
    
    // Explicitly check videosphere visibility
    if(videosphere) {
      try {
        // Ensure the videosphere has the correct default rotation
        const currentRotation = videosphere.getAttribute('rotation') || { x: 0, y: 0, z: 0 };
        videosphere.setAttribute('visible', 'true');
        console.log("Ensuring videosphere visibility and rotation:", currentRotation);
      } catch (e) {
        console.error("Error setting videosphere visibility:", e);
      }
    }
    
    // Use requestAnimationFrame instead of setTimeout for more efficient rendering
    if (PERFORMANCE.useRequestAnimationFrame) {
      // Single initial render
      renderer.render(AFRAME.scenes[0].object3D, AFRAME.scenes[0].camera);
      
      // PERFORMANCE IMPROVEMENT: Reduce number of renders
      // Number of additional renders to attempt
      const numRendersToAttempt = isMobile ? 1 : 2; // Reduced from 2/4
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
          try {
            // Ensure the videosphere has the correct default rotation
            const currentRotation = videosphere.getAttribute('rotation') || { x: 0, y: 0, z: 0 };
            videosphere.setAttribute('visible', 'true');
            console.log("Ensuring videosphere visibility and rotation:", currentRotation);
          } catch (e) {
            console.error("Error setting videosphere visibility:", e);
          }
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
      
      // PERFORMANCE IMPROVEMENT: Fewer render attempts
      // Schedule multiple renders with increasing delays - use fewer renders on mobile
      const renderDelays = isMobile ? [100, 500] : [100, 300, 800]; // Reduced delays and count
      let lastDelay = Math.max(...renderDelays);
      
      renderDelays.forEach(delay => {
        setTimeout(() => {
          if(AFRAME.scenes[0] && AFRAME.scenes[0].renderer) {
            console.log(`Scheduled render at ${delay}ms`);
            AFRAME.scenes[0].renderer.render(AFRAME.scenes[0].object3D, AFRAME.scenes[0].camera);
            
            // Check videosphere visibility again during each render
            if(videosphere) {
              try {
                // Ensure the videosphere has the correct default rotation
                const currentRotation = videosphere.getAttribute('rotation') || { x: 0, y: 0, z: 0 };
                videosphere.setAttribute('visible', 'true');
                console.log("Ensuring videosphere visibility and rotation:", currentRotation);
              } catch (e) {
                console.error("Error setting videosphere visibility:", e);
              }
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

// PERFORMANCE IMPROVEMENT: More aggressive texture optimizations
const optimizeVideoTextures = () => {
  const videosphere = $('videosphere');
  const video = $('video360');
  
  if(videosphere) {
    videosphere.setAttribute('visible', 'true');
    console.log("Set videosphere visible on A-Frame init");
    
    // Add explicit texture optimization for the videosphere
    try {
      const material = videosphere.getObject3D('mesh').material;
      if (material && material.map) {
        // PERFORMANCE IMPROVEMENT: Apply optimizations for both mobile and desktop
        material.map.minFilter = THREE.LinearFilter;
        material.map.magFilter = THREE.LinearFilter;
        material.map.generateMipmaps = false;
        material.map.format = THREE.RGBFormat;
        
        // More aggressive optimizations for mobile
        if (isMobile) {
          material.map.anisotropy = 1; // Disable anisotropic filtering
          material.map.wrapS = THREE.ClampToEdgeWrapping;
          material.map.wrapT = THREE.ClampToEdgeWrapping;
          
          // Reduce update frequency for video texture on mobile
          if (material.map.image && material.map.image === video) {
            material.map.image._videoOptimized = true;
          }
        }
        
        material.map.needsUpdate = true;          
        material.needsUpdate = true;
        console.log("Applied texture optimizations to videosphere");
      }
    } catch (e) {
      console.log("Could not apply texture optimizations:", e);
    }
  }

  // Optimize the video texture update mechanism
  if (window.THREE) {
    try {
      // PERFORMANCE IMPROVEMENT: Apply optimization to both desktop and mobile
      const originalVideoTextureUpdate = THREE.VideoTexture.prototype.update;
      
      THREE.VideoTexture.prototype.update = function() {
        const video = this.image;
        
        // Skip updates if video isn't actually playing or ready
        if (!video || video.paused || video.readyState < video.HAVE_CURRENT_DATA) {
          return;
        }
        
        // Apply throttling on texture updates
        if (isMobile || video._videoOptimized) {
          // For mobile: update ~20fps
          const updateInterval = isMobile ? 50 : 25; // 50ms = ~20fps, 25ms = ~40fps
          if (!video._lastUpdateTime || 
              (performance.now() - video._lastUpdateTime) > updateInterval) {
            this.needsUpdate = true;
            video._lastUpdateTime = performance.now();
          }
        } else {
          // Still throttle on desktop but higher framerate
          this.needsUpdate = true;
        }
      };
      
      console.log("Applied video texture update optimization");
    } catch (e) {
      console.log("Could not optimize video texture updates:", e);
    }
  }
  
  // Additional memory optimization for THREE.js
  if (window.THREE) {
    try {
      // Dispose unused textures and materials when possible
      if (THREE.Cache) {
        // Limit memory usage by THREE.js asset cache
        THREE.Cache.enabled = false;
      }
    } catch (e) {
      console.log("Could not apply THREE.js memory optimizations:", e);
    }
  }
};

// Function to recenter the camera
const recenter = () => {
  // First try to use the A-Frame component approach
  if (typeof window.recenterCamera === 'function') {
    console.log("renderer.js recenter: using window.recenterCamera");
    window.recenterCamera();
    return;
  }
  
  // Fall back to window.recenterCameraFromAFrame
  if (typeof window.recenterCameraFromAFrame === 'function') {
    console.log("renderer.js recenter: using window.recenterCameraFromAFrame");
    window.recenterCameraFromAFrame();
    return;
  }
  
  // Last resort fallback - basic position/rotation reset
  console.log("renderer.js recenter: using basic fallback method");
  const camera = $('cameraEntity');
  if(!camera || !window.AFRAME) return;
  camera.setAttribute('position', {x: 0, y: 1.6, z: 0});
  camera.setAttribute('rotation', {x: 0, y: 0, z: 0});
  
  // Force a render update
  if (window.AFRAME && AFRAME.scenes[0] && AFRAME.scenes[0].renderer) {
    AFRAME.scenes[0].renderer.render(AFRAME.scenes[0].object3D, AFRAME.scenes[0].camera);
  }
};

// PERFORMANCE IMPROVEMENT: Simplified observer
const setupVisibilityObserver = (xrContainer) => {
  const containerObserver = new MutationObserver((mutations) => {
    // Only process once per batch of mutations
    let needsRender = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const target = mutation.target;
        if (target.style.display === 'block' && target.id === 'xrContainer') {
          needsRender = true;
          break; // Exit early once we know we need to render
        }
      }
    }
    
    if (needsRender) {
      console.log("XR container now visible - forcing render");
      // Delay render slightly to allow for style application
      setTimeout(forceAFrameRender, 20);
    }
  });
  
  // Start observing the container for visibility changes
  containerObserver.observe(xrContainer, { attributes: true });
  
  return containerObserver;
};

// PERFORMANCE IMPROVEMENT: Simplified renderer setup function
const setupRendererOptimizations = () => {
  // Listen for A-Frame scene loaded event
  document.addEventListener('a-scene-loaded', () => {
    console.log('A-Frame scene fully loaded, forcing render');
    // Delay initial render to ensure scene is truly ready
    setTimeout(() => {
      forceAFrameRender();
      
      // PERFORMANCE IMPROVEMENT: Fewer render attempts
      // Force fewer renders with optimized delays
      const delayTimes = isMobile ? [300] : [200, 500];
      delayTimes.forEach(delay => {
        setTimeout(forceAFrameRender, delay);
      });
    }, 50);
  });

  // Add a window load event to force render
  window.addEventListener('load', () => {
    console.log('Window fully loaded, forcing render');
    setTimeout(forceAFrameRender, 200);
  });
  
  // Initialize THREE.js optimizations when A-Frame is ready
  document.addEventListener('aframeinitialized', () => {
    console.log("A-Frame initialized");
    optimizeVideoTextures();
  });
};

export {
  createOptimizedRenderer,
  forceAFrameRender,
  recenter,
  setupVisibilityObserver,
  setupRendererOptimizations
}; 