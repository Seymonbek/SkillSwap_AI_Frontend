import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, createWebSocket } from '@/shared/api/api';
import { Card } from '@/shared/ui/molecules/Card';
import { Button } from '@/shared/ui/atoms/Button';
import { Input } from '@/shared/ui/atoms/Input';
import { Avatar } from '@/shared/ui/atoms/Avatar';
import { Typography } from '@/shared/ui/atoms/Typography';
import { Skeleton } from '@/shared/ui/atoms/Skeleton';
import { ListItem } from '@/shared/ui/molecules/ListItem';
import { cn, formatRelativeTime } from '@/shared/lib/utils';
import { Send, Phone, Video, MoreVertical, ChevronLeft, Image, Paperclip } from 'lucide-react';

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
  const messagesEndRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Fetch rooms
  useEffect(() => {
    fetchRooms();
  }, []);

  // Join room when roomId changes
  useEffect(() => {
    if (roomId) {
      const room = rooms.find(r => r.id === parseInt(roomId));
      if (room) {
        setActiveRoom(room);
        fetchMessages(roomId);
        connectWebSocket(roomId);
      }
    }
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [roomId, rooms]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/chat/rooms/');
      setRooms(res.data);
    } catch (err) {
      console.error('Fetch rooms error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (id) => {
    try {
      const res = await api.get(`/chat/rooms/${id}/`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  };

  const connectWebSocket = (id) => {
    const wsConnection = createWebSocket(`/ws/chat/${id}/`);
    
    wsConnection.onopen = () => {
      console.log('WebSocket connected');
    };

    wsConnection.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'message') {
        setMessages(prev => [...prev, data.message]);
      } else if (data.type === 'typing') {
        setIsTyping(data.is_typing);
      }
    };

    wsConnection.onerror = (error) => {
      console.error('WebSocket error:', error);
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
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Mobile view: show rooms list or chat
  const isMobile = window.innerWidth < 768;
  const showRoomList = !roomId || !isMobile;
  const showChat = roomId || !isMobile;

  return (
    <div className="h-[calc(100vh-3.5rem)] flex">
      {/* Rooms List */}
      {(showRoomList || !isMobile) && (
        <div className={cn(
          'w-full md:w-80 border-r border-slate-800 bg-slate-900/50',
          roomId && isMobile && 'hidden'
        )}>
          <div className="p-4 border-b border-slate-800">
            <Typography.H4>Xabarlar</Typography.H4>
          </div>
          <div className="overflow-y-auto h-[calc(100%-4rem)]">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : rooms.length > 0 ? (
              rooms.map(room => (
                <ListItem
                  key={room.id}
                  avatar={{ name: room.name, online: room.is_online }}
                  title={room.name}
                  subtitle={room.last_message?.content || 'Xabar yo\'q'}
                  time={room.last_message?.created_at}
                  unread={room.unread_count > 0}
                  active={parseInt(roomId) === room.id}
                  onClick={() => navigate(`/chat/${room.id}`)}
                />
              ))
            ) : (
              <div className="p-8 text-center">
                <Typography.Small muted>Xonalar yo'q</Typography.Small>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Area */}
      {(showChat || !isMobile) && (
        <div className={cn(
          'flex-1 flex flex-col',
          !roomId && isMobile && 'hidden'
        )}>
          {activeRoom ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-3">
                  {isMobile && (
                    <Button variant="ghost" size="icon" onClick={() => navigate('/chat')}>
                      <ChevronLeft size={20} />
                    </Button>
                  )}
                  <Avatar name={activeRoom.name} size="md" online={activeRoom.is_online} />
                  <div>
                    <Typography.H4 className="text-base">{activeRoom.name}</Typography.H4>
                    {isTyping && (
                      <Typography.Small className="text-emerald-400">
                        Yozmoqda...
                      </Typography.Small>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => navigate(`/video?room=${activeRoom.id}`)}>
                    <Video size={20} />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical size={20} />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => {
                  const isMe = msg.sender?.id === currentUser.id;
                  const showAvatar = index === 0 || messages[index - 1]?.sender?.id !== msg.sender?.id;

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex gap-3',
                        isMe ? 'flex-row-reverse' : 'flex-row'
                      )}
                    >
                      {!isMe && showAvatar && (
                        <Avatar
                          src={msg.sender?.avatar}
                          name={msg.sender?.first_name || msg.sender?.email}
                          size="sm"
                        />
                      )}
                      {!isMe && !showAvatar && <div className="w-8" />}
                      
                      <div
                        className={cn(
                          'max-w-[70%] rounded-2xl px-4 py-2',
                          isMe
                            ? 'bg-emerald-600 text-white rounded-br-sm'
                            : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                        )}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <Typography.Small className={cn(
                          'text-xs mt-1',
                          isMe ? 'text-emerald-200' : 'text-slate-500'
                        )}>
                          {formatRelativeTime(msg.created_at)}
                        </Typography.Small>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Paperclip size={20} />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Image size={20} />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Xabar yozing..."
                    className="flex-1"
                  />
                  <Button
                    variant="primary"
                    size="icon"
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Send size={18} />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Typography.Small muted className="text-lg">
                  Suhbatni boshlash uchun xona tanlang
                </Typography.Small>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
