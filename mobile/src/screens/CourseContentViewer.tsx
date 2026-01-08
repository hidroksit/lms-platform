import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Dimensions,
    Image,
} from 'react-native';
import Video from 'react-native-video';

interface CourseContentViewerProps {
    contentType: 'video' | 'pdf' | 'html' | 'image';
    contentUrl: string;
    title: string;
    onProgress?: (progress: number) => void;
    onComplete?: () => void;
}

interface VideoProgress {
    currentTime: number;
    duration: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CourseContentViewer: React.FC<CourseContentViewerProps> = ({
    contentType,
    contentUrl,
    title,
    onProgress,
    onComplete,
}) => {
    const videoRef = useRef<Video>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);

    // Hide controls after 3 seconds
    useEffect(() => {
        if (!isPaused && showControls) {
            const timer = setTimeout(() => setShowControls(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isPaused, showControls]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleVideoProgress = (data: VideoProgress) => {
        setCurrentTime(data.currentTime);
        const progressPercent = (data.currentTime / duration) * 100;
        onProgress?.(progressPercent);
    };

    const handleVideoLoad = (data: any) => {
        setDuration(data.duration);
        setIsLoading(false);
    };

    const handleVideoEnd = () => {
        onComplete?.();
    };

    const seekTo = (time: number) => {
        videoRef.current?.seek(time);
        setCurrentTime(time);
    };

    const skip = (seconds: number) => {
        const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
        seekTo(newTime);
    };

    const changePlaybackRate = () => {
        const rates = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
        const currentIndex = rates.indexOf(playbackRate);
        const nextIndex = (currentIndex + 1) % rates.length;
        setPlaybackRate(rates[nextIndex]);
    };

    const renderVideoPlayer = () => (
        <View style={styles.videoContainer}>
            <TouchableOpacity
                activeOpacity={1}
                style={styles.videoWrapper}
                onPress={() => setShowControls(!showControls)}
            >
                <Video
                    ref={videoRef}
                    source={{ uri: contentUrl }}
                    style={styles.video}
                    resizeMode="contain"
                    paused={isPaused}
                    rate={playbackRate}
                    onLoad={handleVideoLoad}
                    onProgress={handleVideoProgress}
                    onEnd={handleVideoEnd}
                    onBuffer={({ isBuffering }) => setIsLoading(isBuffering)}
                />

                {isLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#4cc9f0" />
                    </View>
                )}

                {/* Video Controls */}
                {showControls && (
                    <View style={styles.controlsOverlay}>
                        {/* Top Bar */}
                        <View style={styles.topBar}>
                            <Text style={styles.videoTitle} numberOfLines={1}>{title}</Text>
                            <Text style={styles.durationText}>
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </Text>
                        </View>

                        {/* Center Controls */}
                        <View style={styles.centerControls}>
                            <TouchableOpacity onPress={() => skip(-10)} style={styles.skipButton}>
                                <Text style={styles.skipText}>-10s</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setIsPaused(!isPaused)}
                                style={styles.playButton}
                            >
                                <Text style={styles.playButtonText}>
                                    {isPaused ? '▶' : '⏸'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => skip(10)} style={styles.skipButton}>
                                <Text style={styles.skipText}>+10s</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Bottom Bar */}
                        <View style={styles.bottomBar}>
                            {/* Progress Slider */}
                            <View style={styles.progressContainer}>
                                <View style={[styles.progressFill, { width: `${(currentTime / duration) * 100}%` }]} />
                                <TouchableOpacity
                                    style={[styles.progressThumb, { left: `${(currentTime / duration) * 100}%` }]}
                                />
                            </View>

                            <View style={styles.bottomControls}>
                                <TouchableOpacity onPress={changePlaybackRate} style={styles.speedButton}>
                                    <Text style={styles.speedText}>{playbackRate}x</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setIsFullscreen(!isFullscreen)}
                                    style={styles.fullscreenButton}
                                >
                                    <Text style={styles.fullscreenText}>⛶</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );

    const renderPdfViewer = () => (
        <View style={styles.pdfContainer}>
            <View style={styles.pdfPlaceholder}>
                <Text style={styles.pdfIcon}>📄</Text>
                <Text style={styles.pdfTitle}>{title}</Text>
                <Text style={styles.pdfNote}>
                    PDF görüntüleyici için react-native-pdf paketi kullanılmalıdır.
                </Text>
                <TouchableOpacity style={styles.pdfButton}>
                    <Text style={styles.pdfButtonText}>PDF'i Aç</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderImageViewer = () => (
        <ScrollView
            style={styles.imageContainer}
            contentContainerStyle={styles.imageContent}
            maximumZoomScale={3}
            minimumZoomScale={1}
        >
            <Image
                source={{ uri: contentUrl }}
                style={styles.image}
                resizeMode="contain"
                onLoadStart={() => setIsLoading(true)}
                onLoadEnd={() => setIsLoading(false)}
            />
            {isLoading && (
                <View style={styles.imageLoading}>
                    <ActivityIndicator size="large" color="#4cc9f0" />
                </View>
            )}
        </ScrollView>
    );

    const renderContent = () => {
        switch (contentType) {
            case 'video':
                return renderVideoPlayer();
            case 'pdf':
                return renderPdfViewer();
            case 'image':
                return renderImageViewer();
            default:
                return (
                    <View style={styles.unsupported}>
                        <Text style={styles.unsupportedText}>
                            Bu içerik türü desteklenmiyor: {contentType}
                        </Text>
                    </View>
                );
        }
    };

    return (
        <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
            {renderContent()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    fullscreenContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
    videoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoWrapper: {
        width: '100%',
        aspectRatio: 16 / 9,
    },
    video: {
        width: '100%',
        height: '100%',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    controlsOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'space-between',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    videoTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    durationText: {
        color: '#fff',
        fontSize: 14,
        fontFamily: 'monospace',
    },
    centerControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 40,
    },
    skipButton: {
        padding: 12,
    },
    skipText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    playButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButtonText: {
        color: '#fff',
        fontSize: 32,
    },
    bottomBar: {
        padding: 16,
    },
    progressContainer: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
        marginBottom: 12,
    },
    progressFill: {
        height: 4,
        backgroundColor: '#4cc9f0',
        borderRadius: 2,
    },
    progressThumb: {
        position: 'absolute',
        top: -6,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#4cc9f0',
        marginLeft: -8,
    },
    bottomControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    speedButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    speedText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    fullscreenButton: {
        padding: 8,
    },
    fullscreenText: {
        color: '#fff',
        fontSize: 24,
    },
    pdfContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a2e',
    },
    pdfPlaceholder: {
        alignItems: 'center',
        padding: 40,
    },
    pdfIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    pdfTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    pdfNote: {
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    pdfButton: {
        backgroundColor: '#4cc9f0',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    pdfButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    imageContainer: {
        flex: 1,
    },
    imageContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    image: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT * 0.7,
    },
    imageLoading: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unsupported: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    unsupportedText: {
        color: '#888',
        fontSize: 16,
        textAlign: 'center',
    },
});

export default CourseContentViewer;
