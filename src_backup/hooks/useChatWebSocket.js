import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Chat WebSocket Hook
 * Real-time chat messages uchun WebSocket boshqaruvi
 */

export const useChatWebSocket = (roomId, onMessageReceived) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (!roomId) return;
    
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Autentifikatsiya tokeni yo\'q');
      return;
    }

    setIsConnecting(true);
    setError(null);

    // WebSocket URL
    const wsUrl = `ws://13.50.109.251:8000/ws/chat/${roomId}/?token=${token}`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('✅ Chat WebSocket connected:', roomId);
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Chat message received:', data);
        
        // Xabar qabul qilindi
        if (data.type === 'message' || data.message) {
          onMessageReceived?.(data.message || data);
        }
        
        // Typing indicator
        if (data.type === 'typing') {
          // Typing event handling
          onMessageReceived?.({ type: 'typing', user: data.user, isTyping: data.is_typing });
        }
        
        // User joined/left
        if (data.type === 'user_joined' || data.type === 'user_left') {
          onMessageReceived?.(data);
        }
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    };

    socket.onclose = (event) => {
      console.log('❌ Chat WebSocket disconnected:', event.code, event.reason);
      setIsConnected(false);
      setIsConnecting(false);
      
      // Avtomatik qayta ulanish (5 soniyadan keyin)
      if (!event.wasClean && roomId) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Reconnecting chat...');
          connect();
        }, 5000);
      }
    };

    socket.onerror = (error) => {
      console.error('❌ Chat WebSocket error:', error);
      setError('WebSocket ulanishida xatolik');
      setIsConnecting(false);
    };

  }, [roomId, onMessageReceived]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socketRef.current) {
      socketRef.current.close(1000, 'User disconnected');
      socketRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const sendMessage = useCallback((message) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'message',
        content: message,
        room_id: roomId
      }));
      return true;
    }
    return false;
  }, [roomId]);

  const sendTyping = useCallback((isTyping) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'typing',
        room_id: roomId,
        is_typing: isTyping
      }));
    }
  }, [roomId]);

  // Connect/Disconnect effect
  useEffect(() => {
    if (roomId) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [roomId, connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    sendMessage,
    sendTyping,
    connect,
    disconnect
  };
};

export default useChatWebSocket;
