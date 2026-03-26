import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * WebRTC Hook - Video qo'ng'iroqlar uchun
 * RTCPeerConnection, media stream, va signaling boshqaruvi
 */

export const useWebRTC = (socket, callId, localVideoRef, remoteVideoRef) => {
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [iceConnectionState, setIceConnectionState] = useState('new');

  // ICE serverlar (STUN/TURN)
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // TURN serverlar (kamdan-kam NAT orqali ulanish uchun)
    // { urls: 'turn:your-turn-server.com', username: 'user', credential: 'pass' }
  ];

  /**
   * Media stream olish (kamera + mikrofon)
   */
  const getLocalStream = useCallback(async (constraints = { video: true, audio: true }) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (err) {
      console.error('Media olishda xatolik:', err);
      setError('Kamera/mikrofonga ruxsat yo\'q yoki ulanmagan');
      throw err;
    }
  }, [localVideoRef]);

  /**
   * RTCPeerConnection yaratish
   */
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers });
    pcRef.current = pc;

    // ICE candidate event
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.send(JSON.stringify({
          type: 'ice-candidate',
          callId,
          candidate: event.candidate
        }));
      }
    };

    // ICE connection state
    pc.oniceconnectionstatechange = () => {
      setIceConnectionState(pc.iceConnectionState);
      console.log('ICE state:', pc.iceConnectionState);
    };

    // Remote stream qabul qilish
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setIsConnected(true);
        setIsConnecting(false);
      }
    };

    // Connection state
    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setIsConnected(true);
        setIsConnecting(false);
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        setIsConnected(false);
      }
    };

    return pc;
  }, [socket, callId, remoteVideoRef]);

  /**
   * Qo'ng'iroq boshlash (Caller)
   */
  const startCall = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      const stream = await getLocalStream();
      const pc = createPeerConnection();
      
      // Local stream tracklarini qo'shish
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Offer yaratish
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // Signaling serverga yuborish
      if (socket) {
        socket.send(JSON.stringify({
          type: 'offer',
          callId,
          offer: pc.localDescription
        }));
      }
      
    } catch (err) {
      setError('Qo\'ng\'iroq boshlashda xatolik: ' + err.message);
      setIsConnecting(false);
    }
  }, [getLocalStream, createPeerConnection, socket, callId]);

  /**
   * Qo'ng'iroqqa javob berish (Callee)
   */
  const answerCall = useCallback(async (offer) => {
    try {
      setIsConnecting(true);
      setError(null);
      
      const stream = await getLocalStream();
      const pc = createPeerConnection();
      
      // Remote description o'rnatish
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Local stream tracklarini qo'shish
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Answer yaratish
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      // Signaling serverga yuborish
      if (socket) {
        socket.send(JSON.stringify({
          type: 'answer',
          callId,
          answer: pc.localDescription
        }));
      }
      
    } catch (err) {
      setError('Qo\'ng\'iroqqa javob berishda xatolik: ' + err.message);
      setIsConnecting(false);
    }
  }, [getLocalStream, createPeerConnection, socket, callId]);

  /**
   * Offer qabul qilish (Callee tomonidan)
   */
  const handleOffer = useCallback(async (offer) => {
    await answerCall(offer);
  }, [answerCall]);

  /**
   * Answer qabul qilish (Caller tomonidan)
   */
  const handleAnswer = useCallback(async (answer) => {
    const pc = pcRef.current;
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }, []);

  /**
   * ICE Candidate qabul qilish
   */
  const handleIceCandidate = useCallback(async (candidate) => {
    const pc = pcRef.current;
    if (pc && candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('ICE candidate qo\'shishda xatolik:', err);
      }
    }
  }, []);

  /**
   * Signaling xabarlarini qayta ishlash
   */
  const handleSignalingMessage = useCallback((data) => {
    switch (data.type) {
      case 'offer':
        handleOffer(data.offer);
        break;
      case 'answer':
        handleAnswer(data.answer);
        break;
      case 'ice-candidate':
        handleIceCandidate(data.candidate);
        break;
      case 'call-ended':
        endCall();
        break;
      default:
        break;
    }
  }, [handleOffer, handleAnswer, handleIceCandidate]);

  /**
   * Qo'ng'iroqni tugatish
   */
  const endCall = useCallback(() => {
    // Media stream to'xtatish
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Peer connection yopish
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    
    // Video elementlarni tozalash
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    
    // Signaling serverga xabar yuborish
    if (socket) {
      socket.send(JSON.stringify({ type: 'call-ended', callId }));
    }
  }, [socket, callId, localVideoRef, remoteVideoRef]);

  /**
   * Mikrofonni yoqish/o'chirish
   */
  const toggleAudio = useCallback((enabled) => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }, []);

  /**
   * Kamerani yoqish/o'chirish
   */
  const toggleVideo = useCallback((enabled) => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }, []);

  /**
   * Kamerani almashtirish (old/orqa)
   */
  const switchCamera = useCallback(async () => {
    const currentTrack = localStreamRef.current?.getVideoTracks()[0];
    const currentFacing = currentTrack?.getSettings().facingMode;
    const newFacing = currentFacing === 'user' ? 'environment' : 'user';
    
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacing },
        audio: true
      });
      
      const newVideoTrack = newStream.getVideoTracks()[0];
      const sender = pcRef.current?.getSenders().find(s => 
        s.track && s.track.kind === 'video'
      );
      
      if (sender) {
        await sender.replaceTrack(newVideoTrack);
      }
      
      // Eski trackni to'xtatish
      currentTrack?.stop();
      
      // Yangi stream o'rnatish
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = newStream;
      }
      localStreamRef.current = newStream;
      
    } catch (err) {
      console.error('Kamera almashtirishda xatolik:', err);
    }
  }, [localVideoRef]);

  // Cleanup
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
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
    switchCamera,
    localStream: localStreamRef.current,
    peerConnection: pcRef.current
  };
};
