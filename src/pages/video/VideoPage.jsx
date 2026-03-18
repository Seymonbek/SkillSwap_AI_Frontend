import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api, createWebSocket } from '@/shared/api/api';
import { Card, CardContent, CardHeader } from '@/shared/ui/molecules/Card';
import { Button } from '@/shared/ui/atoms/Button';
import { Typography } from '@/shared/ui/atoms/Typography';
import { Avatar } from '@/shared/ui/atoms/Avatar';
import { ListItem } from '@/shared/ui/molecules/ListItem';
import { Modal } from '@/shared/ui/organisms/Modal';
import { cn, formatRelativeTime } from '@/shared/lib/utils';
import { Video, Phone, PhoneOff, Mic, MicOff, Camera, CameraOff, MonitorUp, MoreVertical, ChevronLeft, Users } from 'lucide-react';

export const VideoPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomId = searchParams.get('room');
  
  const [calls, setCalls] = useState([]);
  const [activeCall, setActiveCall] = useState(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const wsRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchCalls();
  }, []);

  useEffect(() => {
    if (roomId) {
      startCall(roomId);
    }
  }, [roomId]);

  const fetchCalls = async () => {
    try {
      const res = await api.get('/video-calls/history/');
      setCalls(res.data.results || []);
    } catch (err) {
      console.error('Fetch calls error:', err);
    }
  };

  const startCall = async (id) => {
    try {
      // Get ICE servers
      const iceRes = await api.get('/video-calls/ice-servers/');
      
      // Create call
      const callRes = await api.post('/video-calls/', {
        room_id: id,
        call_type: 'VIDEO',
      });
      
      setActiveCall(callRes.data);
      setIsInCall(true);
      
      // Initialize WebRTC
      await initializeWebRTC(iceRes.data);
      
      // Connect WebSocket for signaling
      connectSignaling(id);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Start call error:', err);
    }
  };

  const initializeWebRTC = async (iceServers) => {
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
        iceServers: iceServers.map(s => ({ urls: s.urls })),
      });

      // Add local tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      peerConnectionRef.current = pc;
    } catch (err) {
      console.error('WebRTC init error:', err);
    }
  };

  const connectSignaling = (id) => {
    const ws = createWebSocket(`/ws/call/${id}/`);
    
    ws.onopen = () => {
      console.log('Call WebSocket connected');
      // Create offer
      createOffer();
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
          await handleIceCandidate(data.candidate);
          break;
        case 'call_ended':
          endCall();
          break;
      }
    };

    wsRef.current = ws;
  };

  const createOffer = async () => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    wsRef.current?.send(JSON.stringify({
      type: 'offer',
      offer: offer,
    }));
  };

  const handleOffer = async (offer) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    wsRef.current?.send(JSON.stringify({
      type: 'answer',
      answer: answer,
    }));
  };

  const handleAnswer = async (answer) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  };

  const handleIceCandidate = async (candidate) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    await pc.addIceCandidate(new RTCIceCandidate(candidate));
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

  const endCall = () => {
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Close WebSocket
    wsRef.current?.close();

    // Close peer connection
    peerConnectionRef.current?.close();

    // Stop local stream
    localStreamRef.current?.getTracks().forEach(track => track.stop());

    // Reset state
    setIsInCall(false);
    setActiveCall(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoOff(false);

    // Update URL
    navigate('/video');
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      {!isInCall ? (
        <>
          {/* Call History */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Typography.H3>Video Qo'ng'iroqlar</Typography.H3>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Video size={16} />}
                onClick={() => navigate('/chat')}
              >
                Yangi qo'ng'iroq
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {calls.length > 0 ? (
                  calls.map((call) => (
                    <ListItem
                      key={call.id}
                      avatar={{ name: call.participant_name }}
                      title={call.participant_name}
                      subtitle={call.call_type === 'VIDEO' ? 'Video qo\'ng\'iroq' : 'Audio qo\'ng\'iroq'}
                      time={call.created_at}
                      badge={{
                        text: call.status,
                        variant: call.status === 'COMPLETED' ? 'success' : 'default',
                      }}
                      onClick={() => startCall(call.room_id)}
                    />
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Typography.Small muted>Qo'ng'iroqlar tarixi bo'sh</Typography.Small>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        /* Active Call UI */
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-slate-900/50">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={endCall}>
                <ChevronLeft size={24} />
              </Button>
              <div>
                <Typography.H4 className="text-base">{activeCall?.room_name || 'Qo\'ng\'iroq'}</Typography.H4>
                <Typography.Small className="text-emerald-400">
                  {formatDuration(callDuration)}
                </Typography.Small>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <MoreVertical size={20} />
            </Button>
          </div>

          {/* Video Grid */}
          <div className="flex-1 relative p-4">
            {/* Remote Video (Full screen) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover rounded-2xl bg-slate-800"
            />

            {/* Local Video (Picture in Picture) */}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute top-6 right-6 w-32 h-44 object-cover rounded-xl bg-slate-800 border-2 border-slate-700"
            />

            {/* Video off overlay */}
            {isVideoOff && (
              <div className="absolute top-6 right-6 w-32 h-44 rounded-xl bg-slate-800 flex items-center justify-center">
                <CameraOff size={32} className="text-slate-500" />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-6 bg-slate-900/50">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant={isMuted ? 'danger' : 'secondary'}
                size="lg"
                className="rounded-full w-14 h-14"
                onClick={toggleMute}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </Button>

              <Button
                variant="secondary"
                size="lg"
                className="rounded-full w-14 h-14"
                onClick={toggleVideo}
              >
                {isVideoOff ? <CameraOff size={24} /> : <Camera size={24} />}
              </Button>

              <Button
                variant="secondary"
                size="lg"
                className="rounded-full w-14 h-14"
              >
                <MonitorUp size={24} />
              </Button>

              <Button
                variant="danger"
                size="lg"
                className="rounded-full w-14 h-14"
                onClick={endCall}
              >
                <PhoneOff size={24} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
