import { useRef, useEffect } from 'react';

/**
 * SecureVideoPlayer Component
 * 
 * A video player with content protection:
 * - Disables right-click context menu
 * - Disables video download button (controlsList="nodownload")
 * - Prevents keyboard shortcuts for download
 * - Adds overlay to discourage screen recording
 * 
 * @param {Object} props
 * @param {string} props.src - Video source URL
 * @param {string} props.title - Video title for display
 * @param {boolean} props.autoPlay - Auto play video
 * @param {string} props.className - Additional CSS classes
 */
export default function SecureVideoPlayer({
    src,
    title = 'Video Player',
    autoPlay = false,
    className = ''
}) {
    const videoRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const video = videoRef.current;
        const container = containerRef.current;

        if (!video || !container) return;

        // Prevent right-click context menu
        const handleContextMenu = (e) => {
            e.preventDefault();
            return false;
        };

        // Prevent keyboard shortcuts (Ctrl+S, Ctrl+Shift+S)
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
                e.preventDefault();
                return false;
            }
        };

        container.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            container.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className={`secure-video-container ${className}`}
            style={{ position: 'relative' }}
        >
            <video
                ref={videoRef}
                src={src}
                controls
                controlsList="nodownload noplaybackrate"
                disablePictureInPicture
                autoPlay={autoPlay}
                onContextMenu={(e) => e.preventDefault()}
                style={{
                    width: '100%',
                    maxHeight: '500px',
                    borderRadius: '8px',
                    backgroundColor: '#000'
                }}
            >
                Browser Anda tidak mendukung video HTML5.
            </video>

            {/* Invisible overlay to make screen recording harder (optional) */}
            <div
                className="video-protection-overlay"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: '40px', // Leave controls visible
                    pointerEvents: 'none',
                    userSelect: 'none'
                }}
            />

            <style>{`
                .secure-video-container {
                    user-select: none;
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                }

                .secure-video-container video::-webkit-media-controls-enclosure {
                    overflow: hidden;
                }

                .secure-video-container video::-webkit-media-controls-panel {
                    width: calc(100% + 30px);
                }

                /* Hide download button in Chrome */
                .secure-video-container video::-internal-media-controls-download-button {
                    display: none !important;
                }

                .secure-video-container video::-webkit-media-controls-download-button {
                    display: none !important;
                }
            `}</style>
        </div>
    );
}
