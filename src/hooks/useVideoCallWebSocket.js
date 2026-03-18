import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Video Call WebSocket Hook
 * WebRTC signaling uchun WebSocket boshqaruvi
 */

export const useVideoCallWebSocket = (callId, onSignalingMessage) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (!callId) return;
    
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Autentifikatsiya tokeni yo\'q');
      return;
    }

    setIsConnecting(true);
    setError(null);

    // WebSocket URL - backend yangilangan URL
    const wsUrl = `ws://13.50.109.251:8000/ws/call/${callId}/?token=${token}`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('✅ Video Call WebSocket connected:', callId);
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📡 Signaling message received:', data);
        
        // WebRTC signaling xabarlarini qayta ishlash
        onSignalingMessage?.(data);
        
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    };

    socket.onclose = (event) => {
      console.log('❌ Video Call WebSocket disconnected:', event.code, event.reason);
      setIsConnected(false);
      setIsConnecting(false);
      
      // Avtomatik qayta ulanish
      if (!event.wasClean && callId) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Reconnecting video call...');
          connect();
        }, 3000);
      }
    };

    socket.onerror = (error) => {
      console.error('❌ Video Call WebSocket error:', error);
      setError('Video qo\'ng\'iroq ulanishida xatolik');
      setIsConnecting(false);
    };

  }, [callId, onSignalingMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socketRef.current) {
      socketRef.current.close(1000, 'Call ended');
      socketRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  // WebRTC signaling yuborish
  const sendOffer = useCallback((offer) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'offer',
        call_id: callId,
        offer: offer
      }));
      return true;
    }
    return false;
  }, [callId]);

  const sendAnswer = useCallback((answer) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'answer',
        call_id: callId,
        answer: answer
      }));
      return true;
    }
    return false;
  }, [callId]);

  const sendIceCandidate = useCallback((candidate) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'ice-candidate',
        call_id: callId,
        candidate: candidate
      }));
      return true;
    }
    return false;
  }, [callId]);

  const sendCallEnded = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'call-ended',
        call_id: callId
      }));
    }
  }, [callId]);

  // Connect/Disconnect effect
  useEffect(() => {
    if (callId) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [callId, connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    sendCallEnded,
    connect,
    disconnect
  };
};

export default useVideoCallWebSocket;
