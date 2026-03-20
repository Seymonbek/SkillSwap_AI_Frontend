import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { chatService } from '@/shared/api';
import { createWebSocket } from '@/shared/api/api';
import {
  Send, ChevronLeft, Video, MoreVertical, Paperclip,
  Image as ImageIcon, Smile, Phone, Mic, CheckCheck,
  File as FileIcon, X
} from 'lucide-react';

export const ChatPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [ws, setWs] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (roomId && rooms.length > 0) {
      const room = rooms.find(r => String(r.id) === String(roomId));
      if (room) {
        setActiveRoom(room);
        fetchMessages(roomId);
        connectWebSocket(roomId);
        markAsRead(roomId);
      }
    }
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [roomId, rooms]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchRooms = async () => {
    try {
      const res = await chatService.getRooms();
      const data = res.data?.results || res.data || [];
      setRooms(data);
    } catch (err) {
      console.error('Fetch rooms error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (id) => {
    try {
      const res = await chatService.getMessages({ room: id });
      const data = res.data?.results || res.data || [];
      setMessages(data);
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await chatService.markMessagesAsRead({ room: id });
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !roomId) return;
    setSelectedFile(file);
  };

  const sendFile = async () => {
    if (!selectedFile || !roomId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      await chatService.uploadFile(roomId, formData);
      setSelectedFile(null);
    } catch (err) {
      console.error('File upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const connectWebSocket = (id) => {
    const wsConnection = createWebSocket(`/ws/chat/${id}/`);

    wsConnection.onopen = () => {
      console.log('WebSocket connected');
    };

    wsConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'message' || data.type === 'chat_message') {
          const msg = data.message || data;
          setMessages(prev => [...prev, msg]);
        } else if (data.type === 'typing') {
          if (data.user_id !== currentUser.id) {
            setIsTyping(data.is_typing);
            if (data.is_typing) {
              setTimeout(() => setIsTyping(false), 3000);
            }
          }
        } else if (data.type === 'read_receipt') {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === data.message_id ? { ...msg, is_read: true } : msg
            )
          );
        }
      } catch (e) {
        console.error('WS parse error:', e);
      }
    };

    wsConnection.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsConnection.onclose = () => {
      console.log('WebSocket disconnected');
    };

    setWs(wsConnection);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !ws) return;

    ws.send(JSON.stringify({
      type: 'message',
      content: newMessage,
    }));

    setNewMessage('');
    sendTypingIndicator(false);
  };

  const sendTypingIndicator = useCallback((isTypingNow) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'typing',
        is_typing: isTypingNow,
      }));
    }
  }, [ws]);

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

    if (type === 'IMAGE' || type === 'image') {
      return (
        <div>
          <img
            src={msg.file || msg.content}
            alt="Rasm"
            className="max-w-full rounded-lg max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(msg.file || msg.content, '_blank')}
          />
          {msg.content && msg.content !== msg.file && (
            <p className="text-sm mt-1">{msg.content}</p>
          )}
        </div>
      );
    }

    if (type === 'FILE' || type === 'file') {
      return (
        <a
          href={msg.file}
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
  const showRoomList = !roomId || !isMobile;
  const showChat = roomId || !isMobile;

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-slate-950">
      {/* Rooms List */}
      {(showRoomList || !isMobile) && (
        <div className={`w-full md:w-80 border-r border-white/5 bg-slate-900/30 ${roomId && isMobile ? 'hidden' : ''}`}>
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
                  isActive={String(roomId) === String(room.id)}
                  onClick={() => navigate(`/chat/${room.id}`)}
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
        <div className={`flex-1 flex flex-col ${!roomId && isMobile ? 'hidden' : ''}`}>
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
                    onClick={() => navigate(`/video?room=${activeRoom.id}`)}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
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
                  const isMe = msg.sender?.id === currentUser.id || msg.sender === currentUser.id;
                  const showAvatar = index === 0 || messages[index - 1]?.sender?.id !== msg.sender?.id;

                  return (
                    <div
                      key={msg.id || index}
                      className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {!isMe && showAvatar && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {msg.sender?.first_name?.charAt(0).toUpperCase() || '?'}
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
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <Paperclip className="w-5 h-5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => {
                      fileInputRef.current.accept = 'image/*';
                      fileInputRef.current?.click();
                    }}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <ImageIcon className="w-5 h-5 text-slate-400" />
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
                <p className="text-slate-500 text-lg">Suhbatni boshlash uchun xona tanlang</p>
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
