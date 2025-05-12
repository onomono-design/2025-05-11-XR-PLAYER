# 360° Audio-Driven XR Player

A web-based player for immersive 360° video experiences with synchronized audio, designed for both desktop and mobile devices.

## Features

- Dual-mode playback: XR (360° video) or Audio-only mode
- Responsive design for desktop and mobile
- Chapter navigation system
- Teaser mode with CTA overlay
- Seamless audio/video synchronization
- Mobile device orientation controls

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

## Troubleshooting

### Black Screen Issues

If you're experiencing a black screen:

1. **Browser Permissions**: Ensure camera and motion permissions are granted
2. **Video Format**: Confirm the video file is a valid 360° equirectangular format
3. **CORS Issues**: Make sure your video and audio sources allow cross-origin requests
4. **Mobile Device**: On iOS, user interaction is required before video playback
5. **Video Loading**: Check that the video file is properly loading and not too large

### Audio-Video Sync

The player attempts to keep audio and video in sync by monitoring time differences. If sync issues occur, try:

1. Converting the video to a more widely supported format/codec
2. Reducing video resolution or bitrate
3. Ensuring both audio and video files can be streamed properly

## Usage Example

```html
<!-- Include the player in your HTML -->
<iframe src="path/to/index.html" frameborder="0" allowfullscreen></iframe>
```

Or configure directly by modifying the script variables in index.html:

```javascript
const XR_src = "path/to/your/360video.mp4";
const audio_src = "path/to/your/audio.mp3";
// Configure other parameters as needed
``` 