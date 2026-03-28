import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { chatService } from '@/shared/api';
import { createWebSocket, API_BASE_URL } from '@/shared/api/api';
import { Avatar } from '@/shared/ui/atoms/Avatar';
import { Badge } from '@/shared/ui/atoms/Badge';
import { useToast } from '@/shared/ui/providers/useToast';
import { cn } from '@/shared/lib/utils';
import {
  Send, ChevronLeft, Video, MoreVertical, Paperclip,
  Image as ImageIcon, Mic, CheckCheck, File as FileIcon,
  X, Loader2, AlertCircle, Wifi, WifiOff, RotateCcw
} from 'lucide-react';

const DEBUG_CHAT_SOCKET = import.meta.env.DEV && import.meta.env.VITE_DEBUG_WS === 'true';
const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;
const SOCKET_RECONNECT_DELAY_MS = 2500;
const SOCKET_OPEN_TIMEOUT_MS = 3500;
const CHAT_ROOMS_UPDATED_EVENT = 'chat:rooms-updated';

const dispatchChatRoomsUpdated = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CHAT_ROOMS_UPDATED_EVENT));
  }
};

const formatApiError = (error, fallback) => {
  const data = error?.response?.data;

  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (Array.isArray(data) && data.length > 0) {
    return String(data[0]);
  }

  if (data && typeof data === 'object') {
    const directMessage =
      data.detail ||
      data.error ||
      data.message ||
      data.non_field_errors?.[0] ||
      data.content?.[0] ||
      data.room?.[0] ||
      data.file?.[0];

    if (typeof directMessage === 'string' && directMessage.trim()) {
      return directMessage;
    }

    const firstFieldError = Object.values(data).find((value) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }

      return typeof value === 'string' && value.trim();
    });

    if (Array.isArray(firstFieldError) && firstFieldError.length > 0) {
      return String(firstFieldError[0]);
    }

    if (typeof firstFieldError === 'string' && firstFieldError.trim()) {
      return firstFieldError;
    }
  }

  return fallback;
};

const getMessageSenderId = (message) =>
  message?.sender_detail?.id ||
  message?.sender?.id ||
  message?.sender_id ||
  message?.sender ||
  null;

const getRoomPeer = (room, currentUserId) => {
  if (!Array.isArray(room?.participants) || room.participants.length === 0) {
    return null;
  }

  return room.participants.find((participant) => String(participant.id) !== String(currentUserId)) || room.participants[0];
};

const getRoomDisplayName = (room, currentUserId) => {
  const explicitName = room?.name?.trim();
  if (explicitName) {
    return explicitName;
  }

  const peer = getRoomPeer(room, currentUserId);
  const peerName = [peer?.first_name, peer?.last_name].filter(Boolean).join(' ').trim();

  return peerName || peer?.username || peer?.email || (room?.is_group ? 'Guruh suhbati' : 'Suhbat');
};

const getRoomAvatarSource = (room, currentUserId) => {
  const peer = getRoomPeer(room, currentUserId);
  return room?.avatar_url || room?.avatar || peer?.avatar_url || peer?.avatar || null;
};

const getMessagePreview = (message) => {
  if (!message) {
    return "Xabar yo'q";
  }

  const type = String(message.message_type || 'TEXT').toUpperCase();

  if (type === 'IMAGE') {
    return message.content || 'Rasm yuborildi';
  }

  if (type === 'AUDIO') {
    return message.content || 'Audio yuborildi';
  }

  if (type === 'FILE') {
    return message.file_name || 'Fayl yuborildi';
  }

  return message.content || "Xabar yo'q";
};

const sortMessages = (items) => {
  const next = [...items];

  next.sort((a, b) => {
    const left = new Date(a.created_at || 0).getTime();
    const right = new Date(b.created_at || 0).getTime();
    return left - right;
  });

  return next;
};

const formatFileSize = (size) => {
  if (!size) {
    return '0 B';
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getSocketStatusConfig = (status) => {
  switch (status) {
    case 'open':
      return { label: 'Ulangan', variant: 'success', Icon: Wifi };
    case 'connecting':
      return { label: 'Ulanmoqda', variant: 'warning', Icon: Loader2, spin: true };
    case 'reconnecting':
      return { label: 'Qayta ulanmoqda', variant: 'warning', Icon: RotateCcw, spin: true };
    case 'error':
      return { label: 'Ulanishda muammo', variant: 'danger', Icon: WifiOff };
    case 'closed':
      return { label: 'Ulanish yopilgan', variant: 'danger', Icon: WifiOff };
    default:
      return { label: 'Kutilmoqda', variant: 'default', Icon: WifiOff };
  }
};

export const ChatPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [roomsError, setRoomsError] = useState('');
  const [composerError, setComposerError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileType, setSelectedFileType] = useState('FILE');
  const [uploading, setUploading] = useState(false);
  const [chatLookupMessage, setChatLookupMessage] = useState('');
  const [socketStatus, setSocketStatus] = useState('idle');
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const wsRef = useRef(null);
  const wsRoomRef = useRef(null);
  const directRoomAttemptRef = useRef('');
  const reconnectTimeoutRef = useRef(null);
  const typingStopTimeoutRef = useRef(null);
  const typingIndicatorTimeoutRef = useRef(null);
  const initializedRoomRef = useRef(null);
  const manualSocketCloseRef = useRef(false);

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
    const fileName = msg.file_name || (
      fileUrl
        ? decodeURIComponent(fileUrl.split('/').pop() || 'Fayl')
        : null
    );

    return {
      id: msg.id || msg.message_id || `${getMessageSenderId(msg) || 'system'}-${msg.created_at || Date.now()}`,
      room: msg.room || activeRoomId,
      sender: senderDetail,
      sender_detail: senderDetail,
      content: rawContent,
      message_type: messageType,
      file: fileUrl,
      file_url: fileUrl,
      file_name: fileName,
      is_read: Boolean(msg.is_read),
      read_at: msg.read_at || null,
      created_at: msg.created_at || new Date().toISOString(),
    };
  }, [activeRoomId, buildMediaUrl]);

  const setRoomsAndBroadcast = useCallback((updater) => {
    setRooms((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return Array.isArray(next) ? next : prev;
    });
    dispatchChatRoomsUpdated();
  }, []);

  const mergeRoom = useCallback((incomingRoom) => {
    if (!incomingRoom?.id) {
      return;
    }

    setRoomsAndBroadcast((prev) => {
      const index = prev.findIndex((room) => String(room.id) === String(incomingRoom.id));

      if (index === -1) {
        return [incomingRoom, ...prev];
      }

      const next = [...prev];
      next[index] = { ...next[index], ...incomingRoom };
      return next;
    });
  }, [setRoomsAndBroadcast]);

  const markRoomAsReadLocal = useCallback((id) => {
    if (!id) return;

    setRoomsAndBroadcast((prev) =>
      prev.map((room) =>
        String(room.id) === String(id)
          ? { ...room, unread_count: 0 }
          : room
      )
    );
  }, [setRoomsAndBroadcast]);

  const updateRoomAfterMessage = useCallback((roomIdToUpdate, message, options = {}) => {
    if (!roomIdToUpdate) {
      return;
    }

    const {
      incrementUnread = false,
      resetUnread = false,
    } = options;

    const normalizedMessage = normalizeMessage(message);

    setRoomsAndBroadcast((prev) => {
      const index = prev.findIndex((room) => String(room.id) === String(roomIdToUpdate));
      if (index === -1) {
        return prev;
      }

      const existingRoom = prev[index];
      const next = [...prev];
      const unreadCount = resetUnread
        ? 0
        : Math.max(0, Number(existingRoom.unread_count || 0) + (incrementUnread ? 1 : 0));

      const updatedRoom = {
        ...existingRoom,
        last_message: normalizedMessage || existingRoom.last_message,
        unread_count: unreadCount,
      };

      next.splice(index, 1);
      next.unshift(updatedRoom);
      return next;
    });
  }, [normalizeMessage, setRoomsAndBroadcast]);

  const mergeMessage = useCallback((incoming) => {
    const normalized = normalizeMessage(incoming);
    if (!normalized) return;

    setMessages((prev) => {
      const index = prev.findIndex((item) => String(item.id) === String(normalized.id));

      if (index >= 0) {
        const next = [...prev];
        next[index] = { ...next[index], ...normalized };
        return sortMessages(next);
      }

      return sortMessages([...prev, normalized]);
    });
  }, [normalizeMessage]);

  const fetchRooms = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setRoomsLoading(true);
      setRoomsError('');
    }

    try {
      const res = await chatService.getRooms();
      let data = res.data?.results || res.data || [];

      if (activeRoomId && !data.some((room) => String(room.id) === String(activeRoomId))) {
        try {
          const roomRes = await chatService.getRoom(activeRoomId);
          const singleRoom = roomRes.data;

          if (singleRoom?.id) {
            data = [singleRoom, ...data.filter((room) => String(room.id) !== String(singleRoom.id))];
          }
        } catch {
          // Ignore room-detail fetch failure and continue with available rooms.
        }
      }

      setRooms(data);
      dispatchChatRoomsUpdated();
      return data;
    } catch (err) {
      const message = formatApiError(err, 'Chat xonalarini yuklab bo‘lmadi.');
      setRoomsError(message);
      return [];
    } finally {
      if (!silent) {
        setRoomsLoading(false);
      }
    }
  }, [activeRoomId]);

  const fetchMessages = useCallback(async (id, { silent = false } = {}) => {
    if (!id) {
      setMessages([]);
      return [];
    }

    if (!silent) {
      setMessagesLoading(true);
      setComposerError('');
    }

    try {
      const res = await chatService.getMessages({ room_id: id });
      const data = res.data?.results || res.data || [];
      const normalizedMessages = sortMessages(data.map(normalizeMessage).filter(Boolean));
      setMessages(normalizedMessages);
      return normalizedMessages;
    } catch (err) {
      const message = formatApiError(err, 'Xabarlarni yuklab bo‘lmadi.');
      setComposerError(message);
      return [];
    } finally {
      if (!silent) {
        setMessagesLoading(false);
      }
    }
  }, [normalizeMessage]);

  const acknowledgeRoomRead = useCallback(async (id, messageId = null, { silent = true } = {}) => {
    if (!id) return;

    try {
      await chatService.markMessagesAsRead({ room: id });
      markRoomAsReadLocal(id);

      if (wsRef.current?.readyState === WebSocket.OPEN && messageId) {
        wsRef.current.send(JSON.stringify({
          type: 'read_receipt',
          room_id: id,
          message_id: messageId,
        }));
      }
    } catch (err) {
      if (!silent) {
        const message = formatApiError(err, 'Xabarlarni o‘qilgan deb belgilab bo‘lmadi.');
        setComposerError(message);
      }
    }
  }, [markRoomAsReadLocal]);

  const handleIncomingChatMessage = useCallback((payload, fallbackRoomId) => {
    const normalized = normalizeMessage(payload);
    if (!normalized) {
      return;
    }

    mergeMessage(normalized);

    const incomingRoomId = normalized.room || fallbackRoomId;
    const senderId = getMessageSenderId(normalized);
    const isOwnMessage = String(senderId) === String(currentUserId);
    const isActiveRoomMessage = String(incomingRoomId) === String(activeRoomId);

    updateRoomAfterMessage(incomingRoomId, normalized, {
      incrementUnread: !isOwnMessage && !isActiveRoomMessage,
      resetUnread: isActiveRoomMessage,
    });

    const roomExistsLocally = rooms.some((room) => String(room.id) === String(incomingRoomId));
    if (!roomExistsLocally) {
      void fetchRooms({ silent: true });
    }

    if (!isOwnMessage && isActiveRoomMessage) {
      void acknowledgeRoomRead(incomingRoomId, normalized.id);
    }
  }, [
    acknowledgeRoomRead,
    activeRoomId,
    currentUserId,
    fetchRooms,
    mergeMessage,
    normalizeMessage,
    rooms,
    updateRoomAfterMessage,
  ]);

  const cleanupWebSocket = useCallback((socket = wsRef.current) => {
    manualSocketCloseRef.current = true;

    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (!socket) {
      wsRef.current = null;
      wsRoomRef.current = null;
      return;
    }

    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;

    try {
      if ([WebSocket.CONNECTING, WebSocket.OPEN].includes(socket.readyState)) {
        socket.close(1000, 'Cleanup');
      }
    } catch {
      // Ignore socket close errors during cleanup.
    }

    if (wsRef.current === socket) {
      wsRef.current = null;
    }

    if (wsRoomRef.current) {
      wsRoomRef.current = null;
    }
  }, []);

  const connectWebSocket = useCallback((id, { reconnecting = false } = {}) => {
    if (!id) return null;

    const normalizedRoomId = String(id);

    if (
      wsRef.current &&
      wsRoomRef.current === normalizedRoomId &&
      [WebSocket.CONNECTING, WebSocket.OPEN].includes(wsRef.current.readyState)
    ) {
      return wsRef.current;
    }

    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      cleanupWebSocket(wsRef.current);
    }

    manualSocketCloseRef.current = false;
    setSocketStatus(reconnecting ? 'reconnecting' : 'connecting');

    const wsConnection = createWebSocket(`/ws/chat/${id}/`);
    wsRoomRef.current = normalizedRoomId;

    wsConnection.onopen = () => {
      setSocketStatus('open');
      setComposerError('');
    };

    wsConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'message' || data.type === 'chat_message') {
          handleIncomingChatMessage(data, normalizedRoomId);
          return;
        }

        if (data.type === 'typing') {
          if (String(data.user_id) !== String(currentUserId)) {
            setIsTyping(Boolean(data.is_typing));

            if (typingIndicatorTimeoutRef.current) {
              window.clearTimeout(typingIndicatorTimeoutRef.current);
            }

            if (data.is_typing) {
              typingIndicatorTimeoutRef.current = window.setTimeout(() => {
                setIsTyping(false);
              }, 2800);
            }
          }
          return;
        }

        if (data.type === 'read' || data.type === 'read_receipt') {
          const messageId = data.message_id || data.last_message_id;
          setMessages((prev) =>
            prev.map((msg) =>
              String(msg.id) === String(messageId)
                ? { ...msg, is_read: true, read_at: data.read_at || msg.read_at || new Date().toISOString() }
                : msg
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
      setSocketStatus('error');
      if (DEBUG_CHAT_SOCKET) {
        console.error('WebSocket error:', error);
      }
    };

    wsConnection.onclose = (event) => {
      if (wsRef.current === wsConnection) {
        wsRef.current = null;
      }

      if (wsRoomRef.current === normalizedRoomId) {
        wsRoomRef.current = null;
      }

      if (manualSocketCloseRef.current || event.code === 1000) {
        setSocketStatus('closed');
        return;
      }

      setSocketStatus('reconnecting');

      if (String(activeRoomId) === normalizedRoomId) {
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connectWebSocket(normalizedRoomId, { reconnecting: true });
        }, SOCKET_RECONNECT_DELAY_MS);
      }
    };

    wsRef.current = wsConnection;
    return wsConnection;
  }, [activeRoomId, cleanupWebSocket, currentUserId, handleIncomingChatMessage]);

  const waitForSocketOpen = useCallback((socket) => new Promise((resolve) => {
    if (!socket) {
      resolve(false);
      return;
    }

    if (socket.readyState === WebSocket.OPEN) {
      resolve(true);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      cleanup();
      resolve(socket.readyState === WebSocket.OPEN);
    }, SOCKET_OPEN_TIMEOUT_MS);

    const handleOpen = () => {
      cleanup();
      resolve(true);
    };

    const handleFailure = () => {
      cleanup();
      resolve(false);
    };

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      socket.removeEventListener('open', handleOpen);
      socket.removeEventListener('close', handleFailure);
      socket.removeEventListener('error', handleFailure);
    };

    socket.addEventListener('open', handleOpen);
    socket.addEventListener('close', handleFailure);
    socket.addEventListener('error', handleFailure);
  }), []);

  const ensureSocketReady = useCallback(async (id) => {
    if (!id) return null;

    const normalizedRoomId = String(id);
    let socket = wsRef.current;

    if (
      !socket ||
      wsRoomRef.current !== normalizedRoomId ||
      ![WebSocket.CONNECTING, WebSocket.OPEN].includes(socket.readyState)
    ) {
      socket = connectWebSocket(normalizedRoomId);
    }

    const isOpen = await waitForSocketOpen(socket);
    return isOpen ? socket : null;
  }, [connectWebSocket, waitForSocketOpen]);

  const createDirectRoom = useCallback(async (userId) => {
    try {
      const response = await chatService.createDirectRoom(userId, targetUserName || null);
      const room = response.data || response;

      if (room?.id) {
        mergeRoom(room);
        await fetchRooms({ silent: true });
      }

      return room;
    } catch (err) {
      if (DEBUG_CHAT_SOCKET) {
        console.error('Create direct room error:', err);
      }
      return null;
    }
  }, [fetchRooms, mergeRoom, targetUserName]);

  const sendTypingIndicator = useCallback((isTypingNow) => {
    if (!activeRoomId) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        room_id: activeRoomId,
        is_typing: isTypingNow,
      }));
    }
  }, [activeRoomId]);

  const sendMessage = useCallback(async () => {
    const text = newMessage.trim();

    if (!text || !activeRoomId) {
      return;
    }

    setComposerError('');

    const socket = await ensureSocketReady(activeRoomId);
    if (socket) {
      try {
        socket.send(JSON.stringify({
          type: 'message',
          room_id: activeRoomId,
          message: text,
          content: text,
          message_type: 'TEXT',
        }));

        setNewMessage('');
        sendTypingIndicator(false);

        window.setTimeout(() => {
          void fetchMessages(activeRoomId, { silent: true });
          void fetchRooms({ silent: true });
        }, 900);
        return;
      } catch (err) {
        if (DEBUG_CHAT_SOCKET) {
          console.error('WS send error:', err);
        }
      }
    }

    try {
      const response = await chatService.sendMessage({
        room: activeRoomId,
        content: text,
        message_type: 'TEXT',
      });

      mergeMessage(response.data);
      updateRoomAfterMessage(activeRoomId, response.data, { resetUnread: true });
      setNewMessage('');
      sendTypingIndicator(false);
      await fetchRooms({ silent: true });
    } catch (err) {
      const message = formatApiError(
        err,
        'Xabar yuborilmadi. WebSocket yoki backend contractini tekshirish kerak.'
      );
      setComposerError(message);
      toast.error(message);
    }
  }, [
    activeRoomId,
    ensureSocketReady,
    fetchMessages,
    fetchRooms,
    mergeMessage,
    newMessage,
    sendTypingIndicator,
    toast,
    updateRoomAfterMessage,
  ]);

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!activeRoomId) {
      setComposerError('Avval chat xonasini tanlang.');
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      const message = 'Fayl hajmi 50MB dan oshmasligi kerak.';
      setComposerError(message);
      toast.error(message);
      return;
    }

    setSelectedFile(file);
    setComposerError('');
  }, [activeRoomId, toast]);

  const sendFile = useCallback(async () => {
    if (!selectedFile || !activeRoomId) {
      return;
    }

    setUploading(true);
    setComposerError('');

    try {
      const formData = new FormData();
      formData.append('room_id', activeRoomId);
      formData.append('file', selectedFile);
      formData.append('message_type', selectedFileType);

      const response = await chatService.uploadFile(activeRoomId, formData);
      mergeMessage(response.data);
      updateRoomAfterMessage(activeRoomId, response.data, { resetUnread: true });
      setSelectedFile(null);
      setSelectedFileType('FILE');
      await fetchRooms({ silent: true });
      toast.success('Fayl yuborildi.');
    } catch (err) {
      const message = formatApiError(err, 'Fayl yuborilmadi.');
      setComposerError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }, [activeRoomId, fetchRooms, mergeMessage, selectedFile, selectedFileType, toast, updateRoomAfterMessage]);

  const openFilePicker = useCallback((nextType) => {
    if (!fileInputRef.current) {
      return;
    }

    setSelectedFileType(nextType);

    if (nextType === 'IMAGE') {
      fileInputRef.current.accept = 'image/*';
    } else if (nextType === 'AUDIO') {
      fileInputRef.current.accept = 'audio/*';
    } else {
      fileInputRef.current.accept = '*/*';
    }

    fileInputRef.current.click();
  }, []);

  const refreshActiveRoom = useCallback(async () => {
    if (!activeRoomId) {
      return;
    }

    await fetchRooms({ silent: true });
    await fetchMessages(activeRoomId);
    await acknowledgeRoomRead(activeRoomId, null, { silent: true });
    connectWebSocket(activeRoomId, { reconnecting: socketStatus === 'reconnecting' });
  }, [acknowledgeRoomRead, activeRoomId, connectWebSocket, fetchMessages, fetchRooms, socketStatus]);

  const renderMessageContent = (msg) => {
    const type = String(msg.message_type || 'TEXT').toUpperCase();
    const fileUrl = msg.file || msg.file_url;

    if (type === 'IMAGE') {
      return (
        <div className="space-y-2">
          <img
            src={fileUrl || msg.content}
            alt="Rasm"
            className="max-w-full rounded-xl max-h-72 object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(fileUrl || msg.content, '_blank', 'noopener,noreferrer')}
          />
          {msg.content && msg.content !== fileUrl && (
            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
          )}
        </div>
      );
    }

    if (type === 'AUDIO') {
      return (
        <div className="space-y-2">
          <audio controls className="max-w-full">
            <source src={fileUrl} />
            Brauzer audio elementini qo‘llab-quvvatlamaydi.
          </audio>
          {msg.content && msg.content !== fileUrl && (
            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
          )}
        </div>
      );
    }

    if (type === 'FILE') {
      return (
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
        >
          <FileIcon className="w-5 h-5 text-slate-300" />
          <span className="text-sm underline break-all">{msg.file_name || 'Fayl'}</span>
        </a>
      );
    }

    return <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>;
  };

  useEffect(() => {
    void fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!activeRoomId) {
      initializedRoomRef.current = null;
      setActiveRoom(null);
      setMessages([]);
      setChatLookupMessage('');
      setIsTyping(false);
      cleanupWebSocket();
      setSocketStatus('idle');
      return;
    }

    const room = rooms.find((item) => String(item.id) === String(activeRoomId));
    if (!room) {
      return;
    }

    setActiveRoom(room);
    setChatLookupMessage('');

    if (initializedRoomRef.current === String(activeRoomId)) {
      return;
    }

    initializedRoomRef.current = String(activeRoomId);
    cleanupWebSocket();

    const initializeRoom = async () => {
      await fetchMessages(activeRoomId);
      await acknowledgeRoomRead(activeRoomId, null, { silent: true });
      connectWebSocket(activeRoomId);
    };

    void initializeRoom();
  }, [activeRoomId, acknowledgeRoomRead, cleanupWebSocket, connectWebSocket, fetchMessages, rooms]);

  useEffect(() => {
    if (activeRoomId || !targetUserId || roomsLoading) {
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
          ? `${targetUserName} bilan chat tayyorlanmoqda...`
          : 'Chat tayyorlanmoqda...'
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
          ? `${targetUserName} bilan chat topilmadi. Backend direct-room yaratishni qo‘llab-quvvatlashi kerak.`
          : 'Bu foydalanuvchi bilan chat topilmadi. Backend direct-room yaratishni qo‘llab-quvvatlashi kerak.'
      );
    };

    void resolveRoom();

    return () => {
      isCancelled = true;
    };
  }, [activeRoomId, buildRoomRoute, createDirectRoom, navigate, roomsLoading, targetUserId, targetUserName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: messages.length > 1 ? 'smooth' : 'auto' });
  }, [messages]);

  useEffect(() => () => {
    cleanupWebSocket();

    if (typingStopTimeoutRef.current) {
      window.clearTimeout(typingStopTimeoutRef.current);
    }

    if (typingIndicatorTimeoutRef.current) {
      window.clearTimeout(typingIndicatorTimeoutRef.current);
    }
  }, [cleanupWebSocket]);

  const handleInputChange = (event) => {
    setNewMessage(event.target.value);
    setComposerError('');

    sendTypingIndicator(true);

    if (typingStopTimeoutRef.current) {
      window.clearTimeout(typingStopTimeoutRef.current);
    }

    typingStopTimeoutRef.current = window.setTimeout(() => {
      sendTypingIndicator(false);
    }, 1800);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const activeRoomName = activeRoom ? getRoomDisplayName(activeRoom, currentUserId) : '';
  const activeRoomAvatar = activeRoom ? getRoomAvatarSource(activeRoom, currentUserId) : null;
  const socketMeta = getSocketStatusConfig(socketStatus);
  const showRoomList = !activeRoomId || !isMobile;
  const showChat = Boolean(activeRoomId) || !isMobile;

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-slate-950">
      {(showRoomList || !isMobile) && (
        <div className={cn(
          'w-full md:w-80 border-r border-white/5 bg-slate-900/30',
          activeRoomId && isMobile && 'hidden'
        )}>
          <div className="p-4 border-b border-white/5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">Xabarlar</h2>
              <p className="text-xs text-slate-500 mt-1">{rooms.length} ta suhbat</p>
            </div>
            <button
              onClick={() => void fetchRooms()}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              title="Yangilash"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {roomsError && (
            <div className="m-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-300">{roomsError}</p>
                  <button
                    onClick={() => void fetchRooms()}
                    className="mt-2 text-xs text-red-200 underline underline-offset-4"
                  >
                    Qayta urinish
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-y-auto h-[calc(100%-5rem)]">
            {roomsLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="h-16 rounded-xl bg-slate-800/50 animate-pulse" />
                ))}
              </div>
            ) : rooms.length > 0 ? (
              rooms.map((room) => (
                <RoomListItem
                  key={room.id}
                  room={room}
                  currentUserId={currentUserId}
                  isActive={String(activeRoomId) === String(room.id)}
                  onClick={() => navigate(buildRoomRoute(room.id))}
                />
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-slate-500">Hozircha suhbatlar yo‘q</p>
              </div>
            )}
          </div>
        </div>
      )}

      {(showChat || !isMobile) && (
        <div className={cn(
          'flex-1 flex flex-col',
          !activeRoomId && isMobile && 'hidden'
        )}>
          {activeRoom ? (
            <>
              <div className="flex items-center justify-between p-4 border-b border-white/5 bg-slate-900/30">
                <div className="flex items-center gap-3 min-w-0">
                  {isMobile && (
                    <button
                      onClick={() => navigate('/chat')}
                      className="p-2 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
                    >
                      <ChevronLeft className="w-5 h-5 text-slate-400" />
                    </button>
                  )}

                  <Avatar
                    src={activeRoomAvatar}
                    name={activeRoomName}
                    size="md"
                  />

                  <div className="min-w-0">
                    <h3 className="font-semibold text-white truncate">{activeRoomName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={socketMeta.variant} size="sm" className="gap-1 rounded-md">
                        <socketMeta.Icon className={cn('w-3 h-3', socketMeta.spin && 'animate-spin')} />
                        {socketMeta.label}
                      </Badge>
                      {isTyping && (
                        <span className="text-emerald-400 text-xs animate-pulse">Yozmoqda...</span>
                      )}
                    </div>
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
                  <button
                    onClick={() => toast.info('Chat sozlamalari keyingi bosqichda qo‘shiladi.')}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                    title="Qo‘shimcha amallar"
                  >
                    <MoreVertical className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="h-14 rounded-2xl bg-slate-800/50 animate-pulse" />
                    ))}
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg, index) => {
                    const senderId = getMessageSenderId(msg);
                    const previousSenderId = getMessageSenderId(messages[index - 1]);
                    const isMe = String(senderId) === String(currentUserId);
                    const showAvatar = index === 0 || String(previousSenderId) !== String(senderId);

                    return (
                      <div
                        key={msg.id || index}
                        className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        {!isMe && showAvatar && (
                          <Avatar
                            src={msg.sender_detail?.avatar_url || msg.sender?.avatar_url}
                            name={[msg.sender_detail?.first_name, msg.sender_detail?.last_name].filter(Boolean).join(' ').trim() || msg.sender_detail?.email}
                            size="sm"
                            className="flex-shrink-0 mt-0.5"
                          />
                        )}
                        {!isMe && !showAvatar && <div className="w-8" />}

                        <div
                          className={`max-w-[78%] rounded-2xl px-4 py-3 ${isMe
                            ? 'bg-emerald-600 text-white rounded-br-sm'
                            : 'bg-slate-800 text-slate-100 rounded-bl-sm'
                          }`}
                        >
                          {renderMessageContent(msg)}
                          <div className={`flex items-center gap-1 mt-2 ${isMe ? 'justify-end' : ''}`}>
                            <span className={`text-[11px] ${isMe ? 'text-emerald-100/90' : 'text-slate-400'}`}>
                              {new Date(msg.created_at).toLocaleTimeString('uz-UZ', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isMe && msg.is_read && (
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-100/90" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-slate-400 font-medium">Bu suhbatda hali xabar yo‘q</p>
                      <p className="text-slate-500 text-sm mt-1">Birinchi xabarni yozib suhbatni boshlang.</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {selectedFile && (
                <div className="px-4 py-3 border-t border-white/5 bg-slate-900/50">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-white/5">
                    <FileIcon className="w-5 h-5 text-slate-300 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-100 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {selectedFileType} • {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="p-1.5 rounded hover:bg-white/10 transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => void sendFile()}
                      disabled={uploading}
                      className="px-3 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                    >
                      {uploading ? 'Yuborilmoqda...' : 'Yuborish'}
                    </button>
                  </div>
                </div>
              )}

              <div className="p-4 border-t border-white/5 bg-slate-900/30">
                {composerError && (
                  <div className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{composerError}</span>
                  </div>
                )}

                {socketStatus === 'reconnecting' && (
                  <div className="mb-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-300 flex items-center justify-between gap-3">
                    <span>Real-time ulanish tiklanmoqda. Xabar yuborishda REST fallback ishlatiladi.</span>
                    <button
                      onClick={() => void refreshActiveRoom()}
                      className="text-xs underline underline-offset-4"
                    >
                      Hozir yangilash
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <button
                    onClick={() => openFilePicker('FILE')}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                    title="Fayl yuborish"
                  >
                    <Paperclip className="w-5 h-5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => openFilePicker('IMAGE')}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                    title="Rasm yuborish"
                  >
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => openFilePicker('AUDIO')}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                    title="Audio yuborish"
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
                    disabled={uploading}
                  />

                  <button
                    onClick={() => void sendMessage()}
                    disabled={!newMessage.trim() || uploading}
                    className="p-3 rounded-xl bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-600 transition-colors"
                    title="Yuborish"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md px-6">
                <p className="text-slate-400 text-lg">
                  {chatLookupMessage || 'Suhbatni boshlash uchun xona tanlang'}
                </p>
                {activeRoomId && !roomsLoading && (
                  <button
                    onClick={() => void fetchRooms()}
                    className="mt-4 text-sm text-emerald-400 underline underline-offset-4"
                  >
                    Xonalarni qayta yuklash
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const RoomListItem = ({ room, currentUserId, isActive, onClick }) => {
  const roomName = getRoomDisplayName(room, currentUserId);
  const avatarSrc = getRoomAvatarSource(room, currentUserId);
  const preview = getMessagePreview(room.last_message);

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 flex items-center gap-3 cursor-pointer transition-colors',
        isActive ? 'bg-white/5' : 'hover:bg-white/5'
      )}
    >
      <Avatar src={avatarSrc} name={roomName} size="lg" />
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-white truncate">{roomName}</h4>
        <p className="text-sm text-slate-400 truncate">{preview}</p>
      </div>
      {room.unread_count > 0 && (
        <span className="min-w-5 h-5 px-1 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center flex-shrink-0">
          {room.unread_count}
        </span>
      )}
    </div>
  );
};

export default ChatPage;
