# 360° Audio-Driven XR Player

A high-performance web-based player for immersive 360° video experiences with synchronized audio, designed for both desktop and mobile devices.

## Features

- Dual-mode playback: XR (360° video) or Audio-only mode
- High-performance video texture updates for smooth playback
- Responsive design for desktop and mobile devices
- Chapter navigation system
- Teaser mode with CTA overlay
- Seamless audio/video synchronization
- Mobile device orientation controls
- Smart recentering functionality on both desktop and mobile
- Consistent styling with Figtree font from Google Fonts
- Service worker for optimized media caching

## Performance Optimizations

The player includes several optimizations for smooth playback:

- Efficient texture updates using `requestVideoFrameCallback` where available
- Predictive synchronization with playback rate adjustments
- Downscaled video quality on mobile devices
- WebGL optimizations for mobile performance
- Throttled texture updates based on device capabilities
- Service worker for caching media files
- Buffer monitoring and recovery system

## Configuration Parameters

The player accepts the following configuration parameters:

| Parameter | Description |
|-----------|-------------|
| `XR_src` | URL to the 360° video file |
| `audio_src` | URL to the audio track |
| `thumbnail_src` | URL to the artwork/thumbnail image |
| `chapterName` | Name of the current chapter |
| `chapterOrder` | Numerical order of the current chapter |
| `tourName` | Name of the tour |
| `isXR` | Boolean to enable/disable XR mode availability |
| `isTeaser` | Boolean to indicate if this is a teaser version |
| `outroCTA_time` | Time (in seconds) when to show the CTA overlay in teaser mode |
| `outroCTA_backlink` | URL to direct users when clicking the CTA |
| `devToggleAllowed` | Boolean to show/hide the developer toggle button |

## UI/UX Features

### Recenter Functionality

The "Recenter" button in the top bar helps users reset their view:

- **On Desktop**: Resets the camera orientation to the initial view
- **On Mobile**: Adjusts the videosphere orientation to match the current device orientation, effectively resetting the user's view to forward

### Responsive Design

- Figtree font for consistent typography across devices
- Mobile-optimized UI elements with proper touch targets
- Automatic quality adjustments based on device capabilities

## Troubleshooting

### Black Screen Issues

If you're experiencing a black screen:

1. **Browser Permissions**: Ensure camera and motion permissions are granted
2. **Video Format**: Confirm the video file is a valid 360° equirectangular format
3. **CORS Issues**: Make sure your video and audio sources allow cross-origin requests
4. **Mobile Device**: On iOS, user interaction is required before video playback
5. **Video Loading**: Check that the video file is properly loading and not too large

### Audio-Video Sync

The player uses advanced synchronization techniques:

1. **Predictive Sync**: For minor drift, the player adjusts video playback rate instead of seeking
2. **Hard Sync**: For major drift (>1 second), the player performs a hard seek
3. **Throttled Updates**: Sync operations are limited to prevent performance issues

If sync issues persist, try:
- Converting the video to a more widely supported format/codec
- Reducing video resolution or bitrate
- Ensuring both audio and video files can be streamed properly

### Performance Issues

If experiencing poor performance:

1. **Video Quality**: Use a lower resolution/bitrate video file
2. **Mobile Optimization**: Ensure the PERFORMANCE settings in script.js are properly tuned
3. **Browser Support**: Some browsers have better WebGL and video performance than others
4. **Device Capability**: Some older devices may struggle with 360° video playback

## Usage Example

```html
<!-- Include the player in your HTML -->
<iframe src="path/to/index.html" frameborder="0" allowfullscreen></iframe>
```

Or configure directly by modifying the script variables in script.js:

```javascript
const XR_src = "path/to/your/360video.mp4";
const audio_src = "path/to/your/audio.mp3";
// Configure other parameters as needed
```

## Installation

1. Download or clone the repository
2. Configure the media sources in script.js
3. Host on a web server that supports HTTPS (required for device orientation)
4. For mobile usage, ensure your server has proper CORS headers configured 