import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { chatService } from '@/shared/api';
import { createWebSocket, API_BASE_URL } from '@/shared/api/api';
import {
  Send, ChevronLeft, Video, MoreVertical, Paperclip,
  Image as ImageIcon, Mic, CheckCheck,
  File as FileIcon, X
} from 'lucide-react';

const DEBUG_CHAT_SOCKET = import.meta.env.DEV && import.meta.env.VITE_DEBUG_WS === 'true';

export const ChatPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileType, setSelectedFileType] = useState('FILE');
  const [uploading, setUploading] = useState(false);
  const [chatLookupMessage, setChatLookupMessage] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const wsRef = useRef(null);
  const wsRoomRef = useRef(null);
  const directRoomAttemptRef = useRef('');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser?.id;
  const activeRoomId = roomId || searchParams.get('room');
  const targetUserId = searchParams.get('user');
  const targetUserName = searchParams.get('name');
  const sessionContextId = searchParams.get('session');

  const buildRoomRoute = useCallback((nextRoomId) => {
    if (!nextRoomId) return '/chat';
    const params = new URLSearchParams();

    if (sessionContextId) {
      params.set('session', sessionContextId);
    }

    return params.toString()
      ? `/chat/${nextRoomId}?${params.toString()}`
      : `/chat/${nextRoomId}`;
  }, [sessionContextId]);

  const buildVideoRoute = useCallback((nextRoomId) => {
    if (!nextRoomId) return '/video';
    const params = new URLSearchParams({ room: String(nextRoomId) });

    if (sessionContextId) {
      params.set('session', sessionContextId);
    }

    return `/video?${params.toString()}`;
  }, [sessionContextId]);

  const findRoomByParticipant = useCallback((userId) => {
    if (!userId) return null;

    return rooms.find((room) =>
      Array.isArray(room.participants) &&
      room.participants.some((participant) => String(participant.id) === String(userId))
    );
  }, [rooms]);

  const buildMediaUrl = useCallback((value) => {
    if (!value) return null;
    if (/^https?:\/\//i.test(value)) return value;
    const apiOrigin = API_BASE_URL.replace('/api/v1', '');
    return `${apiOrigin}${String(value).startsWith('/') ? '' : '/'}${value}`;
  }, []);

  const normalizeMessage = useCallback((msg) => {
    if (!msg) return null;

    const senderDetail = msg.sender_detail || msg.sender || (msg.sender_id ? { id: msg.sender_id } : null);
    const rawContent = msg.content ?? msg.message ?? '';
    const messageType = String(msg.message_type || 'TEXT').toUpperCase();
    const fileUrl = buildMediaUrl(msg.file || msg.file_url);

    return {
      id: msg.id || msg.message_id || `${msg.sender_id || 'system'}-${msg.created_at || Date.now()}`,
      room: msg.room || activeRoomId,
      sender: senderDetail,
      sender_detail: senderDetail,
      content: rawContent,
      message_type: messageType,
      file: fileUrl,
      file_url: fileUrl,
      file_name: msg.file_name || (fileUrl ? decodeURIComponent(fileUrl.split('/').pop() || 'Fayl') : null),
      is_read: Boolean(msg.is_read),
      read_at: msg.read_at || null,
      created_at: msg.created_at || new Date().toISOString(),
    };
  }, [activeRoomId, buildMediaUrl]);

  const mergeMessage = useCallback((incoming) => {
    const normalized = normalizeMessage(incoming);
    if (!normalized) return;
    setMessages((prev) => {
      const index = prev.findIndex((item) => String(item.id) === String(normalized.id));
      if (index >= 0) {
        const next = [...prev];
        next[index] = { ...next[index], ...normalized };
        return next;
      }
      return [...prev, normalized];
    });
  }, [normalizeMessage]);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await chatService.getRooms();
      const data = res.data?.results || res.data || [];
      setRooms(data);
    } catch (err) {
      console.error('Fetch rooms error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (id) => {
    try {
      const res = await chatService.getMessages({ room_id: id });
      const data = res.data?.results || res.data || [];
      setMessages(data.map(normalizeMessage).filter(Boolean));
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  }, [normalizeMessage]);

  const markAsRead = useCallback(async (id) => {
    try {
      await chatService.markMessagesAsRead({ room: id });
    } catch (err) {
      console.error('Mark read error:', err);
    }
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeRoomId) return;
    setSelectedFile(file);
  };

  const sendFile = async () => {
    if (!selectedFile || !activeRoomId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('message_type', selectedFileType);
      const response = await chatService.uploadFile(activeRoomId, formData);
      mergeMessage(response.data);
      setSelectedFile(null);
      setSelectedFileType('FILE');
    } catch (err) {
      console.error('File upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const cleanupWebSocket = useCallback((socket = wsRef.current) => {
    if (!socket) return;

    const resetRefs = () => {
      if (wsRef.current === socket) {
        wsRef.current = null;
      }
      if (wsRoomRef.current) {
        wsRoomRef.current = null;
      }
    };

    socket.onmessage = null;
    socket.onerror = null;

    if (socket.readyState === WebSocket.CONNECTING) {
      socket.onopen = () => {
        socket.close(1000, 'Cleanup');
        resetRefs();
      };
      socket.onclose = resetRefs;
      return;
    }

    socket.onopen = null;
    socket.onclose = resetRefs;

    if (socket.readyState === WebSocket.OPEN) {
      socket.close(1000, 'Cleanup');
      return;
    }

    resetRefs();
  }, []);

  const createDirectRoom = useCallback(async (userId) => {
    try {
      const response = await chatService.createDirectRoom(userId, targetUserName || null);
      const room = response.data || response;

      if (room?.id) {
        setRooms((prev) => {
          const exists = prev.some((item) => String(item.id) === String(room.id));
          return exists ? prev : [room, ...prev];
        });
      }

      return room;
    } catch (err) {
      console.error('Create direct room error:', err);
      return null;
    }
  }, [targetUserName]);

  const connectWebSocket = useCallback((id) => {
    const normalizedRoomId = String(id);

    if (
      wsRef.current &&
      wsRoomRef.current === normalizedRoomId &&
      [WebSocket.CONNECTING, WebSocket.OPEN].includes(wsRef.current.readyState)
    ) {
      return wsRef.current;
    }

    if (wsRef.current) {
      cleanupWebSocket(wsRef.current);
    }

    const wsConnection = createWebSocket(`/ws/chat/${id}/`);
    wsRoomRef.current = normalizedRoomId;

    wsConnection.onopen = () => {};

    wsConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'message' || data.type === 'chat_message') {
          mergeMessage(data);
        } else if (data.type === 'typing') {
          if (data.user_id !== currentUserId) {
            setIsTyping(data.is_typing);
            if (data.is_typing) {
              setTimeout(() => setIsTyping(false), 3000);
            }
          }
        } else if (data.type === 'read' || data.type === 'read_receipt') {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === data.message_id ? { ...msg, is_read: true } : msg
            )
          );
        }
      } catch (e) {
        if (DEBUG_CHAT_SOCKET) {
          console.error('WS parse error:', e);
        }
      }
    };

    wsConnection.onerror = (error) => {
      if (DEBUG_CHAT_SOCKET) {
        console.error('WebSocket error:', error);
      }
    };

    wsConnection.onclose = () => {
      if (wsRef.current === wsConnection) {
        wsRef.current = null;
      }
      if (wsRoomRef.current === normalizedRoomId) {
        wsRoomRef.current = null;
      }
    };

    wsRef.current = wsConnection;
    return wsConnection;
  }, [cleanupWebSocket, currentUserId, mergeMessage]);

  useEffect(() => () => {
    cleanupWebSocket();
  }, [cleanupWebSocket]);

  const sendMessage = () => {
    if (!newMessage.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({
      type: 'message',
      message: newMessage,
      message_type: 'TEXT',
    }));

    setNewMessage('');
    sendTypingIndicator(false);
  };

  const sendTypingIndicator = useCallback((isTypingNow) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        is_typing: isTypingNow,
      }));
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    if (activeRoomId && rooms.length > 0) {
      const room = rooms.find(r => String(r.id) === String(activeRoomId));
      if (room) {
        setChatLookupMessage('');
        setActiveRoom(room);
        fetchMessages(activeRoomId);
        markAsRead(activeRoomId);

        const connectTimer = window.setTimeout(() => {
          connectWebSocket(activeRoomId);
        }, 120);

        return () => {
          window.clearTimeout(connectTimer);
          cleanupWebSocket();
        };
      }
    }

    if (!activeRoomId) {
      setActiveRoom(null);
      setMessages([]);
      cleanupWebSocket();
    } else {
      directRoomAttemptRef.current = '';
    }

    if (!targetUserId) {
      setChatLookupMessage('');
      directRoomAttemptRef.current = '';
    }

    return undefined;
  }, [activeRoomId, cleanupWebSocket, connectWebSocket, fetchMessages, markAsRead, rooms, targetUserId]);

  useEffect(() => {
    if (activeRoomId || !targetUserId || loading) {
      return undefined;
    }

    const existingRoom = findRoomByParticipant(targetUserId);
    if (existingRoom) {
      setChatLookupMessage('');
      directRoomAttemptRef.current = '';
      navigate(buildRoomRoute(existingRoom.id), { replace: true });
      return undefined;
    }

    const attemptKey = String(targetUserId);
    if (directRoomAttemptRef.current === attemptKey) {
      return undefined;
    }
    directRoomAttemptRef.current = attemptKey;

    let isCancelled = false;

    const resolveRoom = async () => {
      setChatLookupMessage(
        targetUserName
          ? `${targetUserName} bilan chat yaratilmoqda...`
          : 'Chat yaratilmoqda...'
      );

      const createdRoom = await createDirectRoom(targetUserId);
      if (isCancelled) {
        return;
      }

      if (createdRoom?.id) {
        setChatLookupMessage('');
        directRoomAttemptRef.current = '';
        navigate(buildRoomRoute(createdRoom.id), { replace: true });
        return;
      }

      setChatLookupMessage(
        targetUserName
          ? `${targetUserName} bilan chat topilmadi. Backendda direct room yaratish qo'llab-quvvatlashi kerak.`
          : 'Bu foydalanuvchi bilan chat topilmadi. Backendda direct room yaratish qo\'llab-quvvatlashi kerak.'
      );
    };

    resolveRoom();

    return () => {
      isCancelled = true;
    };
  }, [activeRoomId, buildRoomRoute, createDirectRoom, findRoomByParticipant, loading, navigate, targetUserId, targetUserName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);

    // Send typing indicator
    sendTypingIndicator(true);

    // Clear previous timeout
    if (typingTimeout) clearTimeout(typingTimeout);

    // Stop typing after 2s of inactivity
    const timeout = setTimeout(() => {
      sendTypingIndicator(false);
    }, 2000);
    setTypingTimeout(timeout);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderMessageContent = (msg) => {
    const type = msg.message_type || 'text';
    const fileUrl = msg.file || msg.file_url;

    if (type === 'IMAGE' || type === 'image') {
      return (
        <div>
          <img
            src={fileUrl || msg.content}
            alt="Rasm"
            className="max-w-full rounded-lg max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(fileUrl || msg.content, '_blank')}
          />
          {msg.content && msg.content !== fileUrl && (
            <p className="text-sm mt-1">{msg.content}</p>
          )}
        </div>
      );
    }

    if (type === 'AUDIO' || type === 'audio') {
      return (
        <div className="space-y-2">
          <audio controls className="max-w-full">
            <source src={fileUrl} />
            Brauzer audio elementni qo&apos;llab-quvvatlamaydi.
          </audio>
          {msg.content && msg.content !== fileUrl && (
            <p className="text-sm">{msg.content}</p>
          )}
        </div>
      );
    }

    if (type === 'FILE' || type === 'file') {
      return (
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          <FileIcon className="w-5 h-5 text-slate-400" />
          <span className="text-sm underline">{msg.file_name || 'Fayl'}</span>
        </a>
      );
    }

    return <p className="text-sm whitespace-pre-wrap">{msg.content}</p>;
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const showRoomList = !activeRoomId || !isMobile;
  const showChat = activeRoomId || !isMobile;

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-slate-950">
      {/* Rooms List */}
      {(showRoomList || !isMobile) && (
        <div className={`w-full md:w-80 border-r border-white/5 bg-slate-900/30 ${activeRoomId && isMobile ? 'hidden' : ''}`}>
          <div className="p-4 border-b border-white/5">
            <h2 className="text-lg font-bold text-white">Xabarlar</h2>
          </div>
          <div className="overflow-y-auto h-[calc(100%-4rem)]">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-16 rounded-xl bg-slate-800/50 animate-pulse" />
                ))}
              </div>
            ) : rooms.length > 0 ? (
              rooms.map(room => (
                <RoomListItem
                  key={room.id}
                  room={room}
                  isActive={String(activeRoomId) === String(room.id)}
                  onClick={() => navigate(buildRoomRoute(room.id))}
                />
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-slate-500">Xonalar yo&apos;q</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Area */}
      {(showChat || !isMobile) && (
        <div className={`flex-1 flex flex-col ${!activeRoomId && isMobile ? 'hidden' : ''}`}>
          {activeRoom ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/5 bg-slate-900/30">
                <div className="flex items-center gap-3">
                  {isMobile && (
                    <button
                      onClick={() => navigate('/chat')}
                      className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-slate-400" />
                    </button>
                  )}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {activeRoom.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{activeRoom.name}</h3>
                    {isTyping && (
                      <p className="text-emerald-400 text-sm animate-pulse">Yozmoqda...</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(buildVideoRoute(activeRoom.id))}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                    title="Video qo'ng'iroq boshlash"
                  >
                    <Video className="w-5 h-5 text-slate-400" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <MoreVertical className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => {
                  const senderId = msg.sender_detail?.id || msg.sender?.id || msg.sender;
                  const previousSenderId = messages[index - 1]?.sender_detail?.id || messages[index - 1]?.sender?.id || messages[index - 1]?.sender;
                  const isMe = String(senderId) === String(currentUser.id);
                  const showAvatar = index === 0 || String(previousSenderId) !== String(senderId);

                  return (
                    <div
                      key={msg.id || index}
                      className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {!isMe && showAvatar && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {(msg.sender_detail?.first_name || msg.sender?.first_name || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      {!isMe && !showAvatar && <div className="w-8" />}

                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isMe
                        ? 'bg-emerald-600 text-white rounded-br-sm'
                        : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                        }`}>
                        {renderMessageContent(msg)}
                        <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                          <span className={`text-xs ${isMe ? 'text-emerald-200' : 'text-slate-500'}`}>
                            {new Date(msg.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && msg.is_read && (
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-200" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Selected File Preview */}
              {selectedFile && (
                <div className="px-4 py-2 border-t border-white/5 bg-slate-900/50">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50">
                    <FileIcon className="w-5 h-5 text-slate-400" />
                    <span className="text-sm text-slate-300 flex-1 truncate">{selectedFile.name}</span>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={sendFile}
                      disabled={uploading}
                      className="px-3 py-1 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                    >
                      {uploading ? 'Yuborilmoqda...' : 'Yuborish'}
                    </button>
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="p-4 border-t border-white/5 bg-slate-900/30">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => {
                      setSelectedFileType('FILE');
                      fileInputRef.current.accept = '*/*';
                      fileInputRef.current?.click();
                    }}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <Paperclip className="w-5 h-5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFileType('IMAGE');
                      fileInputRef.current.accept = 'image/*';
                      fileInputRef.current?.click();
                    }}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFileType('AUDIO');
                      fileInputRef.current.accept = 'audio/*';
                      fileInputRef.current?.click();
                    }}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <Mic className="w-5 h-5 text-slate-400" />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    placeholder="Xabar yozing..."
                    className="flex-1 glass-input py-2.5"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="p-3 rounded-xl bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-600 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-slate-500 text-lg">
                  {chatLookupMessage || 'Suhbatni boshlash uchun xona tanlang'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const RoomListItem = ({ room, isActive, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${isActive ? 'bg-white/5' : 'hover:bg-white/5'
        }`}
    >
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-semibold">
        {room.name?.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-white truncate">{room.name}</h4>
        <p className="text-sm text-slate-400 truncate">
          {room.last_message?.content || "Xabar yo'q"}
        </p>
      </div>
      {room.unread_count > 0 && (
        <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center flex-shrink-0">
          {room.unread_count}
        </span>
      )}
    </div>
  );
};

export default ChatPage;
