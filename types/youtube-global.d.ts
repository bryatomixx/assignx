/**
 * Global augmentations for the YouTube IFrame Player API.
 * @types/youtube declares the YT namespace but does not augment Window.
 */
interface Window {
  YT: typeof YT;
  onYouTubeIframeAPIReady?: () => void;
}
