import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { chatService, authService, barterService } from '@/shared/api';
import { createWebSocket } from '@/shared/api/api';
import { useBarterStore } from '@/entities/barter/model/store';
import { Modal } from '@/shared/ui/organisms/Modal';
import { Button } from '@/shared/ui/atoms/Button';
import {
  Video, PhoneOff, Mic, MicOff, Camera, CameraOff,
  MonitorUp, ChevronLeft, History, User, Loader2, Star, ShieldAlert
} from 'lucide-react';

const DEBUG_CALLS = import.meta.env.DEV && import.meta.env.VITE_DEBUG_RTC === 'true';
const getSessionMentorId = (session) => session?.mentor_detail?.id || session?.mentor?.id || session?.mentor || null;
const getSessionStudentId = (session) => session?.student_detail?.id || session?.student?.id || session?.student || null;
const getSessionChatRoomId = (session) => session?.chat_room_id || session?.chat_room?.id || session?.chat_room || null;
const getCallPeerId = (call, currentUserId) => {
  if (!call) return null;

  const callerId = call?.caller_detail?.id || call?.caller || null;
  const calleeId = call?.callee_detail?.id || call?.callee || null;

  if (!callerId && !calleeId) {
    return call?.participant_id || call?.participant?.id || null;
  }

  return String(callerId) === String(currentUserId) ? calleeId : callerId;
};
const getSessionPeerId = (session, currentUserId) => {
  if (!session) return null;

  const mentorId = getSessionMentorId(session);
  const studentId = getSessionStudentId(session);

  return String(mentorId) === String(currentUserId) ? studentId : mentorId;
};
const doesSessionMatchRoom = (session, roomId) => {
  const sessionRoomId = getSessionChatRoomId(session);
  if (!sessionRoomId || !roomId) {
    return true;
  }

  return String(sessionRoomId) === String(roomId);
};
const getApiErrorMessage = (error, fallback = 'Xatolik yuz berdi.') => {
  const data = error?.response?.data;

  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (Array.isArray(data) && data.length > 0) {
    return String(data[0]);
  }

  if (data && typeof data === 'object') {
    const directMessage = data.detail || data.error || data.message || data.non_field_errors?.[0];
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

export const VideoPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomId = searchParams.get('room');

  const [calls, setCalls] = useState([]);
  const [activeCall, setActiveCall] = useState(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Barter specific state
  const sessionId = searchParams.get('session');
  const startBarterSession = useBarterStore((state) => state.startBarterSession);
  const completeBarterSession = useBarterStore((state) => state.completeBarterSession);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [limitError, setLimitError] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewReceiverId, setReviewReceiverId] = useState(null);
  const [reviewError, setReviewError] = useState('');
  const [sessionSnapshot, setSessionSnapshot] = useState(null);
  const [mediaPermissionError, setMediaPermissionError] = useState('');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const wsRef = useRef(null);
  const timerRef = useRef(null);
  const iceCandidatesQueue = useRef([]);
  const endingCallRef = useRef(false);
  const startedRoomRef = useRef(null);
  const offerSentRef = useRef(false);
  const callInstanceRef = useRef(0);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchCalls();
  }, []);

  useEffect(() => {
    if (roomId) {
      if (startedRoomRef.current === roomId) {
        return undefined;
      }
      startedRoomRef.current = roomId;
      startCall(roomId);
    }
    return () => {
      cleanupCallResources(false);
      startedRoomRef.current = null;
    };
    // Room param o'zgarganda call lifecycle qayta boshlanadi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const stopMediaStream = (stream) => {
    stream?.getTracks?.().forEach((track) => {
      try {
        track.stop();
      } catch {
        // Ignore track stop failures during teardown.
      }
    });
  };

  const cleanupCallResources = (resetActiveCall = true) => {
    callInstanceRef.current += 1;

    const currentWs = wsRef.current;
    const currentPeerConnection = peerConnectionRef.current;
    const currentLocalStream = localStreamRef.current;
    const currentScreenStream = screenStreamRef.current;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    wsRef.current = null;
    peerConnectionRef.current = null;
    localStreamRef.current = null;
    screenStreamRef.current = null;
    iceCandidatesQueue.current = [];
    offerSentRef.current = false;

    currentWs?.close();
    currentPeerConnection?.getSenders?.().forEach((sender) => {
      try {
        sender.track?.stop();
      } catch {
        // Ignore sender stop failures during teardown.
      }
    });
    currentPeerConnection?.close();
    stopMediaStream(currentLocalStream);
    stopMediaStream(currentScreenStream);

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    setIsInCall(false);
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
    endingCallRef.current = false;

    if (resetActiveCall) {
      setActiveCall(null);
    }
  };

  const fetchCalls = async () => {
    try {
      const res = await chatService.getCalls();
      setCalls(res.data?.results || res.data || []);
    } catch (err) {
      console.error('Fetch calls error:', err);
      setCalls([]);
    }
  };

  const syncActiveCall = async (callInstanceId) => {
    try {
      const activeRes = await chatService.getActiveCall();
      if (callInstanceRef.current !== callInstanceId) {
        return null;
      }

      if (activeRes.data?.id) {
        setActiveCall(activeRes.data);
        return activeRes.data;
      }
    } catch {
      // Ignore transient active-call sync failures.
    }

    if (callInstanceRef.current !== callInstanceId) {
      return null;
    }

    setActiveCall(null);
    return null;
  };

  const goToVideoHome = () => {
    setActiveCall(null);
    fetchCalls();
    navigate('/video');
  };

  const showReviewOrReturn = (receiverId) => {
    if (receiverId) {
      setReviewForm({ rating: 5, comment: '' });
      setReviewReceiverId(receiverId);
      setReviewError('');
      setShowReviewModal(true);
      fetchCalls();
      return;
    }

    goToVideoHome();
  };

  const handleRemoteCallEnd = async () => {
    cleanupCallResources(false);

    if (!sessionId) {
      goToVideoHome();
      return;
    }

    try {
      const sessionRes = await barterService.getSession(sessionId);
      const session = sessionRes.data;
      setSessionSnapshot(session);

      if (session?.status === 'COMPLETED') {
        const reviewTargetId =
          getCallPeerId(activeCall, currentUser.id) ||
          getSessionPeerId(session, currentUser.id);

        showReviewOrReturn(reviewTargetId);
        return;
      }
    } catch {
      // If the session lookup fails, fall back to the default exit path.
    }

    goToVideoHome();
  };

  const startCall = async (id) => {
    const callInstanceId = callInstanceRef.current + 1;
    callInstanceRef.current = callInstanceId;
    setLimitError(false);
    setReviewReceiverId(null);
    setReviewForm({ rating: 5, comment: '' });
    setReviewError('');
    if (!sessionId) {
      setSessionSnapshot(null);
    }

    try {
      // Get ICE servers
      let iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
      try {
        const iceRes = await chatService.getICEServers();
        if (iceRes.data && Array.isArray(iceRes.data)) {
          iceServers = iceRes.data;
        }
      } catch {
        // Use default STUN
      }

      let shouldHandleBarterSession = Boolean(sessionId);
      if (sessionId) {
        try {
          const sessionRes = await barterService.getSession(sessionId);
          const freshSession = sessionRes.data;
          if (callInstanceRef.current !== callInstanceId) return;

          if (doesSessionMatchRoom(freshSession, id)) {
            setSessionSnapshot(freshSession);
          } else {
            shouldHandleBarterSession = false;
            setSessionSnapshot(null);
          }
        } catch {
          // If session fetch fails here, the existing start-session guard below will handle it.
        }
      }
      await syncActiveCall(callInstanceId);

      if (callInstanceRef.current !== callInstanceId) return;
      setIsInCall(true);

      // Initialize WebRTC
      const initialized = await initializeWebRTC(iceServers, id, callInstanceId);
      if (!initialized || callInstanceRef.current !== callInstanceId) {
        if (!initialized && callInstanceRef.current === callInstanceId) {
          cleanupCallResources();
          startedRoomRef.current = null;

          if (roomId) {
            navigate('/video', { replace: true });
          }
        }
        return;
      }

      if (shouldHandleBarterSession && sessionId) {
        const startResult = await startBarterSession(sessionId);

        if (callInstanceRef.current !== callInstanceId) {
          return;
        }

        if (!startResult.success) {
          try {
            const sessionRes = await barterService.getSession(sessionId);
            const freshSession = sessionRes.data;
            setSessionSnapshot(freshSession);

            if (!['IN_PROGRESS', 'COMPLETED'].includes(freshSession?.status)) {
              cleanupCallResources();
              setLimitError(true);
              return;
            }
          } catch {
            cleanupCallResources();
            setLimitError(true);
            return;
          }
        } else if (startResult.session) {
          setSessionSnapshot(startResult.session);
        }
      }

      // Start timer
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Start call error:', err);
      if (callInstanceRef.current === callInstanceId) {
        cleanupCallResources();
        startedRoomRef.current = null;

        if (roomId) {
          navigate('/video', { replace: true });
        }
      }
    }
  };

  const initializeWebRTC = async (iceServers, roomCallId, callInstanceId) => {
    try {
      setMediaPermissionError('');
      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (callInstanceRef.current !== callInstanceId) {
        stopMediaStream(stream);
        return false;
      }

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: iceServers.map(s => ({
          urls: s.urls || s.url,
          username: s.username,
          credential: s.credential,
        })),
      });

      // Add local tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // ICE candidate handler — CRITICAL FIX
      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'ice_candidate',
            candidate: event.candidate.toJSON(),
          }));
        }
      };

      pc.onconnectionstatechange = () => {};

      pc.oniceconnectionstatechange = () => {};

      if (callInstanceRef.current !== callInstanceId) {
        pc.close();
        stopMediaStream(stream);
        return false;
      }

      peerConnectionRef.current = pc;

      // Connect WebSocket for signaling AFTER peer connection is ready
      connectSignaling(roomCallId, callInstanceId);
      return true;
    } catch (err) {
      if (DEBUG_CALLS) {
        console.error('WebRTC init error:', err);
      }
      setMediaPermissionError("Kamera yoki mikrofonga ruxsat berilmadi. Brauzer sozlamasidan ruxsatni yoqing va qayta urinib ko'ring.");
      return false;
    }
  };

  const connectSignaling = (id, callInstanceId) => {
    const ws = createWebSocket(`/ws/call/${id}/`);
    wsRef.current = ws;

    ws.onopen = async () => {
      if (callInstanceRef.current !== callInstanceId) {
        ws.close();
        return;
      }

      const latestActiveCall = await syncActiveCall(callInstanceId);
      if (callInstanceRef.current !== callInstanceId) {
        ws.close();
        return;
      }

      // Process queued ICE candidates
      while (iceCandidatesQueue.current.length > 0) {
        const candidate = iceCandidatesQueue.current.shift();
        handleIceCandidate(candidate);
      }

      const callerId = latestActiveCall?.caller_detail?.id || latestActiveCall?.caller || activeCall?.caller_detail?.id || activeCall?.caller;
      const shouldCreateOffer = !callerId || String(callerId) === String(currentUser.id);
      if (shouldCreateOffer) {
        scheduleOfferCreation();
      }
    };

    ws.onmessage = async (event) => {
      if (callInstanceRef.current !== callInstanceId) {
        return;
      }

      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'incoming_call':
          await syncActiveCall(callInstanceId);
          break;
        case 'call_accepted':
          await syncActiveCall(callInstanceId);
          break;
        case 'call_rejected':
        case 'call_missed':
          cleanupCallResources();
          fetchCalls();
          navigate('/video');
          break;
        case 'offer':
          await handleOffer(data.sdp || data.offer);
          break;
        case 'answer':
          await handleAnswer(data.sdp || data.answer);
          break;
        case 'ice_candidate':
          if (peerConnectionRef.current?.remoteDescription) {
            await handleIceCandidate(data.candidate);
          } else {
            iceCandidatesQueue.current.push(data.candidate);
          }
          break;
        case 'call_ended':
          await handleRemoteCallEnd();
          break;
      }
    };

    ws.onerror = (error) => {
      if (DEBUG_CALLS) {
        console.error('Signaling WS error:', error);
      }
    };

    ws.onclose = () => {
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    };
  };

  const scheduleOfferCreation = (attempt = 0) => {
    window.setTimeout(async () => {
      const isCreated = await createOffer();
      if (!isCreated && attempt < 6) {
        scheduleOfferCreation(attempt + 1);
      }
    }, attempt === 0 ? 100 : 150);
  };

  const createOffer = async () => {
    const pc = peerConnectionRef.current;
    const ws = wsRef.current;
    if (!pc || !ws || ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      if (offerSentRef.current || pc.currentLocalDescription || pc.pendingLocalDescription) {
        return true;
      }
      if (pc.signalingState !== 'stable') {
        return false;
      }
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      offerSentRef.current = true;

      ws.send(JSON.stringify({
        type: 'offer',
        sdp: offer,
      }));
      return true;
    } catch (err) {
      if (DEBUG_CALLS) {
        console.error('Create offer error:', err);
      }
      return false;
    }
  };

  const handleOffer = async (offer) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      if (pc.signalingState !== 'stable') {
        return;
      }
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      wsRef.current?.send(JSON.stringify({
        type: 'answer',
        sdp: answer,
      }));

      // Process queued ICE candidates
      while (iceCandidatesQueue.current.length > 0) {
        const candidate = iceCandidatesQueue.current.shift();
        await handleIceCandidate(candidate);
      }
    } catch (err) {
      if (DEBUG_CALLS) {
        console.error('Handle offer error:', err);
      }
    }
  };

  const handleAnswer = async (answer) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      if (pc.currentRemoteDescription || pc.pendingRemoteDescription) {
        return;
      }
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      offerSentRef.current = false;

      // Process queued ICE candidates
      while (iceCandidatesQueue.current.length > 0) {
        const candidate = iceCandidatesQueue.current.shift();
        await handleIceCandidate(candidate);
      }
    } catch (err) {
      if (DEBUG_CALLS) {
        console.error('Handle answer error:', err);
      }
    }
  };

  const handleIceCandidate = async (candidate) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      if (DEBUG_CALLS) {
        console.error('Add ICE candidate error:', err);
      }
    }
  };

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    const stream = localStreamRef.current;
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;

        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } else {
        const localStream = localStreamRef.current;
        const videoTrack = localStream?.getVideoTracks()[0];
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }

        screenStreamRef.current?.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
        setIsScreenSharing(false);
      }
    } catch (err) {
      if (err?.name === 'NotAllowedError' || err?.name === 'AbortError') {
        return;
      }
      if (DEBUG_CALLS) {
        console.error('Screen share error:', err);
      }
    }
  };

  const endCall = async () => {
    if (endingCallRef.current) return;
    endingCallRef.current = true;

    // Notify peer
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'call_end',
        call_id: activeCall?.id,
      }));
    }
    cleanupCallResources(false);

    if (sessionId) {
      try {
        const sessionRes = await barterService.getSession(sessionId);
        const session = sessionRes.data;
        setSessionSnapshot(session);
        const isMentor = String(getSessionMentorId(session)) === String(currentUser.id);
        const nextReviewReceiverId =
          getCallPeerId(activeCall, currentUser.id) ||
          getSessionPeerId(session, currentUser.id);

        if (session?.status === 'COMPLETED') {
          showReviewOrReturn(nextReviewReceiverId);
        } else if (isMentor && session?.status === 'IN_PROGRESS') {
          const result = await completeBarterSession(sessionId);
          let finalSession = result?.session || session;

          if (!result?.success) {
            try {
              const latestSessionRes = await barterService.getSession(sessionId);
              finalSession = latestSessionRes.data || finalSession;
            } catch {
              finalSession = finalSession || null;
            }
          }

          if (finalSession?.status === 'COMPLETED') {
            setSessionSnapshot(finalSession);
            const finalReviewReceiverId =
              getCallPeerId(activeCall, currentUser.id) ||
              getSessionPeerId(finalSession, currentUser.id);

            showReviewOrReturn(finalReviewReceiverId);
          } else {
            goToVideoHome();
          }
        } else {
          goToVideoHome();
        }
      } catch {
        goToVideoHome();
      }
    } else {
      goToVideoHome();
    }
    endingCallRef.current = false;
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    setReviewError('');

    try {
      const receiverId =
        reviewReceiverId ||
        getCallPeerId(activeCall, currentUser.id) ||
        getSessionPeerId(sessionSnapshot, currentUser.id);

      if (receiverId) {
        await authService.createReview({
          receiver: receiverId,
          review_type: 'BARTER',
          rating: reviewForm.rating,
          comment: reviewForm.comment,
          session: sessionId,
        });
      }

      setShowReviewModal(false);
      setReviewReceiverId(null);
      setReviewForm({ rating: 5, comment: '' });
      goToVideoHome();
    } catch (err) {
      console.error('Review error:', err);
      setReviewError(getApiErrorMessage(err, "Bahoni yuborib bo'lmadi."));
    }

    setSubmittingReview(false);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setReviewReceiverId(null);
    setReviewForm({ rating: 5, comment: '' });
    setReviewError('');
    goToVideoHome();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const callOverlay = isInCall && typeof document !== 'undefined'
    ? createPortal(
      <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 md:px-5 md:py-4 bg-slate-900/80 border-b border-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={endCall}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              title="Qo'ng'iroqni tugatish"
            >
              <ChevronLeft className="w-6 h-6 text-slate-400" />
            </button>
            <div className="min-w-0">
              <h3 className="text-white font-semibold truncate">{activeCall?.room_name || sessionSnapshot?.topic || "Qo'ng'iroq"}</h3>
              <p className="text-emerald-400 text-sm">{formatDuration(callDuration)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pl-3">
            {isScreenSharing && (
              <span className="hidden sm:inline-flex px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                Ekran ulashilmoqda
              </span>
            )}
            <button
              onClick={endCall}
              className="hidden md:inline-flex px-3 py-2 rounded-lg bg-red-500/15 text-red-300 border border-red-500/25 hover:bg-red-500/25 transition-colors text-sm font-medium"
            >
              Chiqish
            </button>
          </div>
        </div>

        <div className="flex-1 relative bg-slate-950">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover bg-slate-800"
          />
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute top-4 right-4 w-24 h-32 sm:w-28 sm:h-36 md:top-6 md:right-6 md:w-32 md:h-44 object-cover rounded-xl bg-slate-800 border-2 border-white/10 shadow-xl"
          />
          {isVideoOff && (
            <div className="absolute top-4 right-4 w-24 h-32 sm:w-28 sm:h-36 md:top-6 md:right-6 md:w-32 md:h-44 rounded-xl bg-slate-800 flex items-center justify-center border-2 border-white/10 shadow-xl">
              <CameraOff className="w-8 h-8 text-slate-500" />
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-10 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent">
            <div className="flex items-center justify-center gap-3 md:gap-4">
              <button
                onClick={toggleMute}
                className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${isMuted
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-slate-800 text-white border border-white/10 hover:bg-slate-700'
                  }`}
              >
                {isMuted ? <MicOff className="w-5 h-5 md:w-6 md:h-6" /> : <Mic className="w-5 h-5 md:w-6 md:h-6" />}
              </button>

              <button
                onClick={toggleVideo}
                className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${isVideoOff
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-slate-800 text-white border border-white/10 hover:bg-slate-700'
                  }`}
              >
                {isVideoOff ? <CameraOff className="w-5 h-5 md:w-6 md:h-6" /> : <Camera className="w-5 h-5 md:w-6 md:h-6" />}
              </button>

              <button
                onClick={toggleScreenShare}
                className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${isScreenSharing
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-slate-800 text-white border border-white/10 hover:bg-slate-700'
                  }`}
              >
                <MonitorUp className="w-5 h-5 md:w-6 md:h-6" />
              </button>

              <button
                onClick={endCall}
                className="px-4 h-12 md:px-5 md:h-14 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center transition-all shadow-lg shadow-red-500/30 gap-2 font-medium"
              >
                <PhoneOff className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-sm md:text-base">Tugatish</span>
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )
    : null;

  return (
    <div className="min-h-screen p-4 sm:p-6 pb-24">
      <div className="blob-bg">
        <div className="blob blob-1" style={{ width: '250px', height: '250px', opacity: 0.1 }} />
      </div>

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        {!isInCall ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                  <Video className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    <span className="neon-text">Video Qo&apos;ng&apos;iroqlar</span>
                  </h1>
                  <p className="text-slate-400 text-sm">Video muloqot va qo&apos;ng&apos;iroqlar</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/chat')}
                className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" />
                Yangi qo&apos;ng&apos;iroq
              </button>
            </div>

            <div className="glass-card">
              {calls.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {calls.map((call) => (
                    <div
                      key={call.id}
                      onClick={() => startCall(call.room_id || call.room)}
                      className="p-4 flex items-start sm:items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {call.participant_name?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white">{call.participant_name || 'Foydalanuvchi'}</h4>
                        <p className="text-sm text-slate-400">
                          {call.call_type === 'VIDEO' ? "Video qo'ng'iroq" : "Audio qo'ng'iroq"}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className={`px-2 py-1 rounded-full text-xs ${call.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border border-white/5'
                          }`}>
                          {call.status}
                        </span>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(call.created_at).toLocaleDateString('uz-UZ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                    <History className="w-10 h-10 text-slate-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Qo&apos;ng&apos;iroqlar tarixi bo&apos;sh</h3>
                  <p className="text-slate-400 mb-6">Birinchi video qo&apos;ng&apos;iroqni boshlash uchun Chat sahifasiga o&apos;ting</p>
                  <button onClick={() => navigate('/chat')} className="btn-primary">
                    <Video className="w-4 h-4 mr-2" />
                    Chatga o&apos;tish
                  </button>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
      {callOverlay}

      {limitError && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4 border border-red-500/30">
              <PhoneOff className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Limit tugadi!</h3>
            <p className="text-slate-400 mb-6">Bugungi 2 soatlik dars limitingiz tugadi yoki xatolik yuz berdi.</p>
            <button onClick={() => { setLimitError(false); navigate('/barter'); }} className="btn-primary w-full">
              Qaytish
            </button>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-white mb-2">Dars yakunlandi!</h3>
            <p className="text-slate-400 mb-6">Ushbu dars uchun tokenni o&apos;tkazish muvaffaqiyatli bajarildi. Iltimos, suhbatdoshingizga baho bering.</p>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              {reviewError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {reviewError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Baho (1-5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button type="button" key={star} onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                      <Star className={`w-8 h-8 ${reviewForm.rating >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Fikr (ixtiyoriy)</label>
                <textarea rows={3} value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  className="glass-input w-full" placeholder="Dars qanday o'tdi?" />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button type="button" onClick={closeReviewModal} className="btn-secondary flex-1 py-3">
                  Keyinroq
                </button>
                <button type="submit" disabled={submittingReview} className="btn-primary flex-1 py-3 mt-0">
                  {submittingReview ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Baholash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Modal
        isOpen={Boolean(mediaPermissionError)}
        onClose={() => setMediaPermissionError('')}
        title="Kamera yoki mikrofon bloklangan"
        description="Video qo'ng'iroq boshlanishi uchun brauzer kameraga va mikrofonga ruxsat olishi kerak."
        footer={(
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setMediaPermissionError('')}
            >
              Yopish
            </Button>
            <Button
              type="button"
              onClick={() => {
                setMediaPermissionError('');
                window.location.reload();
              }}
            >
              Qayta urinish
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-100">{mediaPermissionError}</p>
              <p className="mt-2 text-sm text-slate-400">
                Chrome manzil satri yonidagi kamera belgisi orqali ruxsatni `Allow` qiling. Keyin yana callni boshlang.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VideoPage;
