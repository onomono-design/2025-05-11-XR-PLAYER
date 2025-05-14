# 360° Audio-Driven XR Player

A high-performance web-based player for immersive 360° video experiences with synchronized audio, designed for both desktop and mobile devices.

## Features

- Seamless dual-mode playback: XR (360° video) or Audio-only mode with continuous audio.
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

## Desktop vs. Mobile Experience

The player automatically detects the device type and provides distinct experiences:

### Desktop Controls
- **Initial View**: Camera starts with rotation (0, -90, 0), providing a forward-facing initial view
- **Navigation Method**: Mouse-based look controls for both panning (horizontal) and tilting (vertical)
- **Interaction**: Click and drag in any direction to look around the 360° environment
- **Performance**: Higher resolution video playback and rendering quality
- **Recentering**: When the "Recenter" button is clicked, the camera rotation resets to the original (0, -90, 0) setting, returning to the initial view direction
- **Input Method**: No device orientation data is used, allowing for traditional mouse/trackpad control

### Mobile Controls
- **Navigation Method**: Hybrid control system with two separate mechanisms:
  - **Device Orientation**: Physical device movement controls both panning AND tilting
  - **Touch Controls**: Touch/swipe only affects panning (horizontal movement), NOT tilting
- **Interaction**: Move the device physically to look around, or swipe horizontally to pan
- **Performance**: Automatically optimized video resolution and rendering settings for mobile devices
- **Permissions**: On iOS, the player requests device motion permissions during initialization
- **Recentering**: When the "Recenter" button is clicked, the videosphere rotation is adjusted to align with the user's current forward direction, making wherever the user is currently facing the "front" view
- **Fallback**: If device orientation is not available or permission is denied, falls back to full touch-based controls (both panning and tilting)

### Technical Implementation
- The detection between desktop and mobile is handled by matching against pointer coarse media queries
- Initial camera rotation on desktop is set to (0, -90, 0) to provide a consistent starting view
- Mobile devices use A-Frame's `magicWindowTrackingEnabled` for device orientation
- On mobile with orientation enabled, touch controls are modified to primarily affect horizontal movement by setting a near-zero `verticalDragFactor`
- The recenter function works differently based on device:
  - Desktop: Resets camera rotation to initial values
  - Mobile: Adjusts videosphere rotation to match current camera direction

## Device Orientation Permissions

### iOS Specific Requirements
Starting with iOS 13, Apple requires explicit user permission to access device orientation data:

1. **Permission Request**: When the user clicks "Begin Tour" on iOS devices, the player automatically requests device motion and orientation permission
2. **Permission Dialog**: Users will see a browser dialog asking to "Allow motion and orientation access"
3. **If Granted**: The player will use device orientation for immersive control with touch limited to horizontal panning
4. **If Denied**: The player automatically falls back to full touch-based controls for both panning and tilting

### Android Behavior
Most Android devices provide device orientation data without explicit permission prompts:

1. **No Permission Dialog**: Android users typically don't see a permission request
2. **Automatic Detection**: The player checks if orientation events are firing
3. **Control Configuration**: When orientation is available, touch is limited to horizontal panning
4. **Fallback**: If orientation events are not available, the player automatically enhances touch controls for both panning and tilting

### Permission Troubleshooting
If device orientation isn't working properly:

1. **iOS Settings**: Go to Settings → Safari → Motion & Orientation Access and ensure it's enabled
2. **iOS Per-Site Settings**: For iOS 13+, you may need to enable the permission for the specific site
3. **Android Chrome**: Ensure "Motion sensors" is enabled in Chrome settings
4. **Using Touch Controls**: Even if device orientation is unavailable, you can always use touch controls to navigate

### Fallback Touch Controls
When device orientation is unavailable:

1. **Enhanced Touch Sensitivity**: The player automatically increases touch sensitivity for better navigation
2. **User Notification**: A message notifies the user that touch controls are being used
3. **Swiping**: Users can swipe in any direction to look around the 360° environment

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

### Loading Experience

- **Initial Screen**: The player presents an initial landing screen with a "Begin Tour" button to ensure user interaction before media loading, crucial for autoplay policies and permissions on mobile devices.
- **Modal Loading Indicator**: After the user initiates the experience, a modal overlay with a spinner is displayed, indicating that the audio and video content are actively loading. This overlay disappears once the media is ready for playback.

### Recenter Functionality

The "Recenter" button in the top bar helps users reset their view, with behavior that adapts to the device type:

- **On Desktop**: Resets the camera rotation to its initial values (0, -90, 0), returning to the starting view regardless of current orientation.
- **On Mobile**: Adjusts the videosphere rotation to match the current device orientation, effectively making the direction the user is currently facing the new "front" direction. This is particularly useful when physical device rotation has left the user disoriented.

### Responsive Design

- Figtree font for consistent typography across devices
- Mobile-optimized UI elements with proper touch targets
- Automatic quality adjustments based on device capabilities

### Mode Switching

- Toggling between XR mode and Audio-only mode is designed to be seamless. The audio playback continues without interruption, providing a smooth transition for the user.

## Troubleshooting

### Device Orientation Issues

#### On Mobile
1. **Permission Denied**: If device orientation permission is denied, the player will show a helpful message and fall back to full touch controls
2. **Not Working**: Ensure your device has a gyroscope and accelerometer
3. **iOS Specific**: iOS requires explicit permission for device orientation access, which the player requests on startup
4. **Android Specific**: Most Android devices allow orientation access without explicit permission
5. **Browser Support**: Chrome, Safari, and Firefox on modern mobile devices support orientation tracking
6. **Limited Touch Movement**: By design, when device orientation is enabled, touch controls only affect horizontal movement (panning)

#### On Desktop
1. **Mouse Controls**: The desktop version relies exclusively on mouse or trackpad movement for both panning and tilting
2. **Initial View**: The starting view should be facing forward with camera rotation (0, -90, 0)
3. **Broken Controls**: If mouse controls aren't working, try refreshing the page
4. **Browser Compatibility**: Ensure you're using a modern browser that supports WebGL and A-Frame

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
3. Host on a web server that supports HTTPS (required for device orientation on mobile)
4. For mobile usage, ensure your server has proper CORS headers configured 