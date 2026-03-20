import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { chatService } from '@/shared/api';
import { createWebSocket } from '@/shared/api/api';
import {
  Video, PhoneOff, Mic, MicOff, Camera, CameraOff,
  MonitorUp, ChevronLeft, History, User, Loader2
} from 'lucide-react';

export const VideoPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomId = searchParams.get('room');

  const [callLoading, setCallLoading] = useState(false);
  const [calls, setCalls] = useState([]);
  const [activeCall, setActiveCall] = useState(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const wsRef = useRef(null);
  const timerRef = useRef(null);
  const iceCandidatesQueue = useRef([]);

  useEffect(() => {
    fetchCalls();
  }, []);

  useEffect(() => {
    if (roomId) {
      startCall(roomId);
    }
    return () => {
      if (isInCall) endCall();
    };
  }, [roomId]);

  const fetchCalls = async () => {
    try {
      const res = await chatService.getCalls();
      setCalls(res.data?.results || res.data || []);
    } catch (err) {
      console.error('Fetch calls error:', err);
      setCalls([]);
    }
  };

  const startCall = async (id) => {
    try {
      setCallLoading(true);
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

      // Get active call info
      try {
        const activeRes = await chatService.getActiveCall();
        setActiveCall(activeRes.data);
      } catch {
        // No active call
      }

      setIsInCall(true);

      // Initialize WebRTC
      await initializeWebRTC(iceServers, id);

      // Start timer
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Start call error:', err);
    } finally {
      setCallLoading(false);
    }
  };

  const initializeWebRTC = async (iceServers, roomCallId) => {
    try {
      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

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

      // Connection state changes
      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          console.warn('WebRTC connection failed or disconnected');
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);
      };

      peerConnectionRef.current = pc;

      // Connect WebSocket for signaling AFTER peer connection is ready
      connectSignaling(roomCallId);
    } catch (err) {
      console.error('WebRTC init error:', err);
      alert("Kamera yoki mikrofonga ruxsat berilmadi");
    }
  };

  const connectSignaling = (id) => {
    const ws = createWebSocket(`/ws/call/${id}/`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Call WebSocket connected');

      // Process queued ICE candidates
      while (iceCandidatesQueue.current.length > 0) {
        const candidate = iceCandidatesQueue.current.shift();
        handleIceCandidate(candidate);
      }

      // Create offer after WS is fully ready
      setTimeout(() => createOffer(), 100);
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'offer':
          await handleOffer(data.offer);
          break;
        case 'answer':
          await handleAnswer(data.answer);
          break;
        case 'ice_candidate':
          if (peerConnectionRef.current?.remoteDescription) {
            await handleIceCandidate(data.candidate);
          } else {
            iceCandidatesQueue.current.push(data.candidate);
          }
          break;
        case 'call_ended':
          endCall();
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('Signaling WS error:', error);
    };
  };

  const createOffer = async () => {
    const pc = peerConnectionRef.current;
    const ws = wsRef.current;
    if (!pc || !ws || ws.readyState !== WebSocket.OPEN) {
      console.warn('Cannot create offer: PC or WS not ready');
      return;
    }

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      ws.send(JSON.stringify({
        type: 'offer',
        offer: offer,
      }));
    } catch (err) {
      console.error('Create offer error:', err);
    }
  };

  const handleOffer = async (offer) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      wsRef.current?.send(JSON.stringify({
        type: 'answer',
        answer: answer,
      }));

      // Process queued ICE candidates
      while (iceCandidatesQueue.current.length > 0) {
        const candidate = iceCandidatesQueue.current.shift();
        await handleIceCandidate(candidate);
      }
    } catch (err) {
      console.error('Handle offer error:', err);
    }
  };

  const handleAnswer = async (answer) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));

      // Process queued ICE candidates
      while (iceCandidatesQueue.current.length > 0) {
        const candidate = iceCandidatesQueue.current.shift();
        await handleIceCandidate(candidate);
      }
    } catch (err) {
      console.error('Handle answer error:', err);
    }
  };

  const handleIceCandidate = async (candidate) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error('Add ICE candidate error:', err);
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
      console.error('Screen share error:', err);
    }
  };

  const endCall = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    // Notify peer
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'call_ended' }));
    }

    wsRef.current?.close();
    peerConnectionRef.current?.close();
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    screenStreamRef.current?.getTracks().forEach(track => track.stop());

    peerConnectionRef.current = null;
    localStreamRef.current = null;
    screenStreamRef.current = null;
    wsRef.current = null;

    setIsInCall(false);
    setActiveCall(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
    iceCandidatesQueue.current = [];

    navigate('/video');
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="blob-bg">
        <div className="blob blob-1" style={{ width: '250px', height: '250px', opacity: 0.1 }} />
      </div>

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        {!isInCall ? (
          <>
            <div className="flex items-center justify-between">
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
                className="btn-primary flex items-center gap-2"
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
                      className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors"
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
                      <div className="text-right">
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
        ) : (
          <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
            <div className="flex items-center justify-between p-4 bg-slate-900/50 border-b border-white/5">
              <div className="flex items-center gap-3">
                <button onClick={endCall} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <ChevronLeft className="w-6 h-6 text-slate-400" />
                </button>
                <div>
                  <h3 className="text-white font-semibold">{activeCall?.room_name || "Qo'ng'iroq"}</h3>
                  <p className="text-emerald-400 text-sm">{formatDuration(callDuration)}</p>
                </div>
              </div>
              {isScreenSharing && (
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                  Ekran ulashilmoqda
                </span>
              )}
            </div>

            <div className="flex-1 relative p-4">
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover rounded-2xl bg-slate-800" />
              <video ref={localVideoRef} autoPlay playsInline muted className="absolute top-6 right-6 w-32 h-44 object-cover rounded-xl bg-slate-800 border-2 border-white/10" />
              {isVideoOff && (
                <div className="absolute top-6 right-6 w-32 h-44 rounded-xl bg-slate-800 flex items-center justify-center border-2 border-white/10">
                  <CameraOff className="w-8 h-8 text-slate-500" />
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-900/50 border-t border-white/5">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={toggleMute}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-slate-800 text-white border border-white/10 hover:bg-slate-700'
                    }`}
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>

                <button
                  onClick={toggleVideo}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isVideoOff
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-slate-800 text-white border border-white/10 hover:bg-slate-700'
                    }`}
                >
                  {isVideoOff ? <CameraOff className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
                </button>

                <button
                  onClick={toggleScreenShare}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isScreenSharing
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-slate-800 text-white border border-white/10 hover:bg-slate-700'
                    }`}
                >
                  <MonitorUp className="w-6 h-6" />
                </button>

                <button
                  onClick={endCall}
                  className="w-14 h-14 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center transition-all shadow-lg shadow-red-500/30"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPage;
