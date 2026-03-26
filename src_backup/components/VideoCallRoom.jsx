import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, PhoneOff, Mic, MicOff, Video, VideoOff, 
  Camera, MoreVertical, X, Loader2, AlertCircle,
  Maximize2, Minimize2, User
} from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';

/**
 * VideoCallRoom - Haqiqiy video qo'ng'iroq komponenti
 * WebRTC + WebSocket signaling
 */

export const VideoCallRoom = ({ 
  callId, 
  isCaller = false,
  calleeId = null,
  roomName = '',
  onEndCall,
  socket // WebSocket connection
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  
  const {
    isConnected,
    isConnecting,
    error,
    iceConnectionState,
    startCall,
    answerCall,
    endCall,
    handleSignalingMessage,
    toggleAudio,
    toggleVideo,
    switchCamera
  } = useWebRTC(socket, callId, localVideoRef, remoteVideoRef);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);

  // WebSocket xabarlarini qayta ishlash
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event) => {
      const data = JSON.parse(event.data);
      handleSignalingMessage(data);
    };

    socket.addEventListener('message', handleMessage);
    
    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, handleSignalingMessage]);

  // Qo'ng'iroqni boshlash (caller uchun)
  useEffect(() => {
    if (isCaller && !isConnected && !isConnecting && socket) {
      startCall();
    }
  }, [isCaller, isConnected, isConnecting, socket, startCall]);

  // Qo'ng'iroq davomiyligi
  useEffect(() => {
    let interval;
    if (isConnected) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isConnected]);

  // Tugatish
  const handleEndCall = () => {
    endCall();
    onEndCall?.();
  };

  // Mikrofon toggle
  const handleToggleAudio = () => {
    const newState = !isMuted;
    setIsMuted(newState);
    toggleAudio(!newState);
  };

  // Video toggle
  const handleToggleVideo = () => {
    const newState = !isVideoOff;
    setIsVideoOff(newState);
    toggleVideo(!newState);
  };

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Vaqt formati
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Connecting state
  if (isConnecting && !isConnected) {
    return (
      <div className="video-call-overlay" style={styles.overlay}>
        <div style={styles.connectingContainer}>
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={styles.pulseRing}
          />
          <div style={styles.connectingAvatar}>
            <User size={48} style={{ color: '#94a3b8' }} />
          </div>
          <h3 style={styles.connectingText}>
            {isCaller ? 'Qo\'ng\'iroq qilinmoqda...' : 'Qo\'ng\'iroq kelmoqda...'}
          </h3>
          <p style={styles.connectingSubtext}>
            {roomName || `ID: ${callId}`}
          </p>
          
          {isCaller && (
            <button onClick={handleEndCall} style={styles.cancelButton}>
              <PhoneOff size={20} /> Bekor qilish
            </button>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="video-call-overlay" style={styles.overlay}>
        <div style={styles.errorContainer}>
          <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: 16 }} />
          <h3 style={{ color: '#ef4444', marginBottom: 8 }}>Xatolik yuz berdi</h3>
          <p style={{ color: '#94a3b8', marginBottom: 24 }}>{error}</p>
          <button onClick={handleEndCall} style={styles.endCallButton}>
            <X size={20} /> Yopish
          </button>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="video-call-room"
        style={{
          ...styles.container,
          ...(isFullscreen ? styles.fullscreen : {})
        }}
        onMouseMove={() => setShowControls(true)}
        onMouseLeave={() => setTimeout(() => setShowControls(false), 3000)}
      >
        {/* Remote Video (Katta) */}
        <div style={styles.remoteVideoContainer}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={styles.remoteVideo}
          />
          
          {/* Placeholder agar remote video bo'lmasa */}
          {!isConnected && (
            <div style={styles.remotePlaceholder}>
              <User size={64} style={{ color: '#475569' }} />
              <p style={{ color: '#64748b', marginTop: 12 }}>Ulanish kutilmoqda...</p>
            </div>
          )}
        </div>

        {/* Local Video (Kichik, picture-in-picture) */}
        <motion.div
          drag
          dragConstraints={{ left: -200, right: 200, top: -100, bottom: 100 }}
          style={styles.localVideoContainer}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              ...styles.localVideo,
              ...(isVideoOff ? { display: 'none' } : {})
            }}
          />
          {isVideoOff && (
            <div style={styles.localVideoOff}>
              <User size={32} style={{ color: '#64748b' }} />
            </div>
          )}
        </motion.div>

        {/* Call Info */}
        <div style={styles.callInfo}>
          <div style={styles.callStatus}>
            <span style={styles.statusDot(isConnected)} />
            {isConnected ? 'Aloqa o\'rnatildi' : 'Ulanmoqda...'}
          </div>
          {isConnected && (
            <div style={styles.duration}>{formatDuration(callDuration)}</div>
          )}
        </div>

        {/* Controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={styles.controls}
            >
              {/* Audio Toggle */}
              <button
                onClick={handleToggleAudio}
                style={{
                  ...styles.controlButton,
                  background: isMuted ? '#ef4444' : 'rgba(255,255,255,0.1)'
                }}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>

              {/* Video Toggle */}
              <button
                onClick={handleToggleVideo}
                style={{
                  ...styles.controlButton,
                  background: isVideoOff ? '#ef4444' : 'rgba(255,255,255,0.1)'
                }}
              >
                {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
              </button>

              {/* Switch Camera (mobile) */}
              <button
                onClick={switchCamera}
                style={styles.controlButton}
              >
                <Camera size={24} />
              </button>

              {/* End Call */}
              <button
                onClick={handleEndCall}
                style={{ ...styles.controlButton, ...styles.endCallButton }}
              >
                <PhoneOff size={24} />
              </button>

              {/* Fullscreen Toggle */}
              <button
                onClick={handleToggleFullscreen}
                style={styles.controlButton}
              >
                {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ICE Connection State (Debug) */}
        {process.env.NODE_ENV === 'development' && (
          <div style={styles.debugInfo}>
            ICE: {iceConnectionState}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// Inline styles
const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  },
  container: {
    position: 'fixed',
    inset: 0,
    background: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 9999
  },
  fullscreen: {
    position: 'fixed',
    borderRadius: 0
  },
  remoteVideoContainer: {
    flex: 1,
    position: 'relative',
    background: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  remotePlaceholder: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
  },
  localVideoContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 200,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    background: '#1e293b',
    border: '2px solid rgba(255,255,255,0.1)',
    cursor: 'grab',
    zIndex: 10
  },
  localVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scaleX(-1)' // Mirror effect
  },
  localVideoOff: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#334155'
  },
  callInfo: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10
  },
  callStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: 500
  },
  statusDot: (isConnected) => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: isConnected ? '#10b981' : '#f59e0b',
    animation: isConnected ? 'none' : 'pulse 1.5s infinite'
  }),
  duration: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: 600,
    color: 'white',
    fontFamily: 'monospace'
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 16,
    padding: '12px 24px',
    background: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 50,
    backdropFilter: 'blur(10px)',
    zIndex: 10
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      background: 'rgba(255,255,255,0.2)'
    }
  },
  endCallButton: {
    background: '#ef4444',
    ':hover': {
      background: '#dc2626'
    }
  },
  connectingContainer: {
    textAlign: 'center',
    position: 'relative'
  },
  pulseRing: {
    position: 'absolute',
    inset: -20,
    borderRadius: '50%',
    border: '3px solid rgba(59, 130, 246, 0.3)'
  },
  connectingAvatar: {
    width: 120,
    height: 120,
    borderRadius: '50%',
    background: 'rgba(59, 130, 246, 0.1)',
    border: '2px solid rgba(59, 130, 246, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px'
  },
  connectingText: {
    color: 'white',
    fontSize: 24,
    marginBottom: 8
  },
  connectingSubtext: {
    color: '#64748b',
    fontSize: 16
  },
  cancelButton: {
    marginTop: 32,
    padding: '12px 24px',
    borderRadius: 50,
    border: 'none',
    background: '#ef4444',
    color: 'white',
    fontSize: 16,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer'
  },
  errorContainer: {
    textAlign: 'center',
    padding: 40,
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    border: '1px solid rgba(239, 68, 68, 0.3)'
  },
  debugInfo: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'monospace'
  }
};

export default VideoCallRoom;
