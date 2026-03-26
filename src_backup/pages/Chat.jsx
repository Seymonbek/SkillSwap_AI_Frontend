import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { useChatWebSocket } from '../hooks/useChatWebSocket';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Send, Paperclip, Loader2, Plus, X, ChevronLeft, Edit3, Trash2, Wifi, WifiOff } from 'lucide-react';

export default function Chat() {
  const {
    rooms, activeRoom, messages, isLoading, error,
    fetchRooms, setActiveRoom, sendMessage, uploadFile, createRoom, updateRoom, deleteRoom, markRead
  } = useChatStore();
  const { user } = useAuthStore();
  const [input, setInput] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showRoomEdit, setShowRoomEdit] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [editRoomName, setEditRoomName] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // WebSocket ulanish
  const handleWebSocketMessage = (data) => {
    if (data.type === 'message' && data.id) {
      // Yangi xabar qo'shish
      useChatStore.setState((state) => ({
        messages: [...state.messages, data]
      }));
    }
    if (data.type === 'typing') {
      // Typing indicator
      if (data.isTyping) {
        setTypingUsers(prev => [...new Set([...prev, data.user])]);
        // 3 soniyadan keyin o'chirish
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u !== data.user));
        }, 3000);
      }
    }
  };

  const { isConnected, sendMessage: sendWsMessage, sendTyping } = useChatWebSocket(
    activeRoom?.id,
    handleWebSocketMessage
  );

  useEffect(() => { fetchRooms(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (activeRoom) markRead(activeRoom.id); }, [activeRoom]);

  const handleSend = async () => {
    if (!input.trim() || !activeRoom) return;
    const text = input;
    setInput('');

    // Avval WebSocket orqali yuborishga harakat qilish
    const sentViaWs = sendWsMessage(text);

    // Agar WebSocket ishlamasa, REST API orqali yuborish
    if (!sentViaWs) {
      await sendMessage(activeRoom.id, text);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);

    // Typing indicator yuborish
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTyping(true);

    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 2000);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTyping(false);
      handleSend();
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeRoom) return;
    const type = file.type.startsWith('image/') ? 'IMAGE' : file.type.startsWith('audio/') ? 'AUDIO' : 'FILE';
    await uploadFile(activeRoom.id, file, type);
    e.target.value = '';
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    const room = await createRoom({ name: roomName || null });
    if (room) {
      setShowCreate(false);
      setRoomName('');
      setActiveRoom(room);
    }
  };

  const openRoomEdit = () => {
    setEditRoomName(activeRoom?.name || '');
    setShowRoomEdit(true);
    setEditSuccess('');
  };

  const handleRoomEdit = async (e) => {
    e.preventDefault();
    const ok = await updateRoom(activeRoom.id, { name: editRoomName });
    if (ok) {
      setEditSuccess('Yangilandi!');
      setTimeout(() => { setShowRoomEdit(false); setEditSuccess(''); }, 1000);
    }
  };

  const handleRoomDelete = async () => {
    if (confirm("Xonani o'chirishni xohlaysizmi?")) {
      await deleteRoom(activeRoom.id);
    }
  };

  const getRoomName = (room) => {
    if (room.name) return room.name;
    const other = room.participants?.find((p) => p.id !== user?.id);
    return other ? (other.first_name || other.email) : 'Xona';
  };

  const fmtTime = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const navigate = useNavigate();

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn--secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }} title="Orqaga">
            <ChevronLeft size={20} />
          </button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MessageCircle size={24} style={{ color: '#22c55e' }} /> Chat
          </h1>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="chat-layout">
        {/* Rooms sidebar */}
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <span className="chat-sidebar-title">Xonalar</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* WebSocket status */}
              {activeRoom && (
                <div title={isConnected ? 'Real-time ulanish' : 'Ulanish yo\'q'} style={{ display: 'flex', alignItems: 'center' }}>
                  {isConnected ? (
                    <Wifi size={16} style={{ color: '#22c55e' }} />
                  ) : (
                    <WifiOff size={16} style={{ color: '#ef4444' }} />
                  )}
                </div>
              )}
              <button className="btn btn--primary btn--sm" onClick={() => setShowCreate(true)}><Plus size={14} /></button>
            </div>
          </div>
          <div className="chat-rooms-list">
            {isLoading ? (
              <div className="loader-center"><Loader2 className="animate-spin" size={20} style={{ color: '#8b5cf6' }} /></div>
            ) : rooms.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#475569', fontSize: 13 }}>Xonalar yo'q</div>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.id}
                  className={`chat-room-item ${activeRoom?.id === room.id ? 'chat-room-item--active' : ''}`}
                  onClick={() => setActiveRoom(room)}
                >
                  <div className="chat-room-avatar">
                    {getRoomName(room)?.[0]?.toUpperCase() || '#'}
                  </div>
                  <div className="chat-room-info">
                    <div className="chat-room-name">{getRoomName(room)}</div>
                    <div className="chat-room-last-msg">
                      {room.last_message?.content || "Xabarlar yo'q"}
                    </div>
                  </div>
                  {room.unread_count > 0 && (
                    <div className="chat-room-badge">{room.unread_count}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat main area */}
        <div className="chat-main">
          {activeRoom ? (
            <>
              <div className="chat-main-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span>{getRoomName(activeRoom)}</span>
                  {/* Typing indicator */}
                  {typingUsers.length > 0 && (
                    <div style={{ fontSize: 12, color: '#8b5cf6', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ animation: 'pulse 1.5s infinite' }}>•••</span>
                      {typingUsers.join(', ')} yozmoqda
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn--secondary btn--sm" onClick={openRoomEdit} title="Tahrirlash">
                    <Edit3 size={14} />
                  </button>
                  <button className="btn btn--danger btn--sm" onClick={handleRoomDelete} title="O'chirish">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="chat-messages">
                {messages.map((msg) => {
                  const isMine = msg.sender === user?.id;
                  return (
                    <div key={msg.id} className={`chat-msg ${isMine ? 'chat-msg--mine' : 'chat-msg--other'}`}>
                      {!isMine && <div className="chat-msg-sender">{msg.sender_detail?.first_name || msg.sender_detail?.email || `#${msg.sender}`}</div>}
                      {msg.file ? (
                        msg.message_type === 'IMAGE' ? (
                          <img src={msg.file} alt="img" style={{ maxWidth: 240, borderRadius: 8 }} />
                        ) : (
                          <a href={msg.file} target="_blank" rel="noreferrer" style={{ color: isMine ? 'white' : '#8b5cf6', textDecoration: 'underline' }}>📎 Fayl</a>
                        )
                      ) : (
                        msg.content
                      )}
                      <div className="chat-msg-time">{fmtTime(msg.created_at)}</div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="chat-input-bar">
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFile} />
                <button className="chat-file-btn" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip size={18} />
                </button>
                <input
                  className="chat-input"
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKey}
                  placeholder="Xabar yozish..."
                />
                <button className="chat-send-btn" onClick={handleSend}>
                  <Send size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="chat-empty">
              <MessageCircle size={56} style={{ marginBottom: 16 }} />
              <p style={{ fontSize: 15, fontWeight: 500 }}>Chatni boshlash uchun xonani tanlang</p>
            </div>
          )}
        </div>
      </div>

      {/* Create room modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)}>
            <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="modal-title">Yangi xona</h3>
                <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleCreateRoom}>
                <div className="form-group">
                  <label className="form-label">Nomi (ixtiyoriy)</label>
                  <input className="form-input" value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Xona nomi" />
                </div>
                <button type="submit" className="btn btn--primary" style={{ width: '100%' }}>Yaratish</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit room modal */}
      <AnimatePresence>
        {showRoomEdit && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRoomEdit(false)}>
            <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Edit3 size={18} style={{ color: '#f59e0b' }} /> Xonani tahrirlash
                </h3>
                <button onClick={() => setShowRoomEdit(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              {editSuccess && <div className="success-msg">{editSuccess}</div>}
              <form onSubmit={handleRoomEdit}>
                <div className="form-group">
                  <label className="form-label">Xona nomi</label>
                  <input className="form-input" value={editRoomName} onChange={(e) => setEditRoomName(e.target.value)} placeholder="Xona nomi" />
                </div>
                <button type="submit" className="btn btn--primary" style={{ width: '100%' }}>Saqlash</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
