import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { Monitor, StopCircle, Copy, Check, Users, Shield, Maximize2, X, Globe, Play, Zap } from 'lucide-react';

const Host = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  const [stream, setStream] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [hostEmail, setHostEmail] = useState('');
  const videoRef = useRef(null);
  const peerConnections = useRef({});

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const email = query.get('email');
    if (email) setHostEmail(email);
  }, [location]);

  useEffect(() => {
    if (!socket || !roomCode) return;

    const initRoom = () => {
      socket.emit('create-room', { roomCode, hostEmail });
    };

    initRoom();
    socket.on('connect', initRoom);

    socket.on('new-join-request', (data) => {
      setPendingRequests(prev => {
        if (prev.find(r => r.id === data.id)) return prev;
        return [...prev, data];
      });
    });

    socket.on('viewer-joined', async ({ id, email }) => {
      setViewers(prev => {
        if (prev.find(v => v.id === id)) return prev;
        return [...prev, { id, email }];
      });
    });

    socket.on('viewer-ready', ({ from }) => {
      console.log("Viewer ready signal received:", from);
      if (isSharing && stream) {
        createOffer(from);
      }
    });

    socket.on('viewer-left', ({ viewerId }) => {
      setViewers(prev => prev.filter(v => v.id !== viewerId));
      if (peerConnections.current[viewerId]) {
        peerConnections.current[viewerId].close();
        delete peerConnections.current[viewerId];
      }
    });

    socket.on('answer', async ({ from, answer }) => {
      const pc = peerConnections.current[from];
      if (pc && pc.signalingState !== 'stable') {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) { console.error("Answer Error:", err); }
      }
    });

    socket.on('ice-candidate', async ({ from, candidate }) => {
      const pc = peerConnections.current[from];
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) { console.error("ICE Error:", err); }
      }
    });

    return () => {
      socket.off('connect', initRoom);
      socket.off('new-join-request');
      socket.off('viewer-joined');
      socket.off('viewer-ready');
      socket.off('viewer-left');
      socket.off('answer');
      socket.off('ice-candidate');
    };
  }, [socket, roomCode, hostEmail, isSharing, stream]);

  const createOffer = async (viewerId) => {
    if (!stream) return;
    try {
      if (peerConnections.current[viewerId]) {
        peerConnections.current[viewerId].close();
      }

      const pc = new RTCPeerConnection(iceServers);
      peerConnections.current[viewerId] = pc;
      
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      
      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit('ice-candidate', { to: viewerId, candidate: e.candidate });
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', { to: viewerId, offer });
    } catch (err) { console.error("Offer Error:", err); }
  };

  const startSharing = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      setStream(mediaStream);
      setIsSharing(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      viewers.forEach(v => createOffer(v.id));

      mediaStream.getVideoTracks()[0].onended = stopSharing;
    } catch (err) { console.error(err); }
  };

  const stopSharing = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsSharing(false);
      Object.keys(peerConnections.current).forEach(id => {
        peerConnections.current[id].close();
        delete peerConnections.current[id];
      });
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAcceptRequest = (req) => {
    socket.emit('accept-viewer', { roomCode, viewerId: req.id, email: req.email });
    setPendingRequests(prev => prev.filter(r => r.id !== req.id));
  };

  const handleRejectRequest = (id) => {
    socket.emit('reject-viewer', { viewerId: id });
    setPendingRequests(prev => prev.filter(r => r.id !== id));
  };

  const handleKick = (id) => {
    socket.emit('kick-viewer', { roomCode, viewerId: id });
    setViewers(prev => prev.filter(v => v.id !== id));
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 h-14 fixed top-0 w-full z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-blue-900 flex items-center justify-center text-white font-black text-sm">N</div>
          <div className="flex flex-col">
            <h1 className="text-xs font-black uppercase tracking-widest leading-none">
              <span className="text-slate-900">Nikki</span>
              <span className="text-blue-900">Sky</span>
            </h1>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">{hostEmail || 'Admin Node'}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="border border-slate-200 px-3 py-1 flex items-center gap-3">
            <span className="text-xs font-black font-mono tracking-widest uppercase">{roomCode}</span>
            <button onClick={copyCode} className="text-slate-300 hover:text-blue-900 transition-colors">
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
          <button onClick={() => navigate('/')} className="px-4 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-blue-900 transition-colors">Exit Node</button>
        </div>
      </header>

      <main className="pt-20 pb-6 px-6 max-w-[1500px] mx-auto grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-slate-200 flex flex-col relative overflow-hidden h-[600px] shadow-sm">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 ${isSharing ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
                <h2 className="font-black text-slate-500 uppercase tracking-widest text-[10px]">{isSharing ? 'Live Broadcast Channel' : 'Standby Mode'}</h2>
              </div>
              <button className="text-slate-300 hover:text-blue-900 transition-colors"><Maximize2 size={16} /></button>
            </div>
            
            <div className="flex-grow bg-[#0f172a] relative overflow-hidden flex items-center justify-center">
              {isSharing ? (
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-contain shadow-2xl" />
              ) : (
                <div className="text-center p-8">
                  <Monitor size={48} className="text-slate-700 mx-auto mb-6" />
                  <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Ready to Broadcast?</h3>
                  <button onClick={startSharing} className="px-10 py-4 bg-blue-900 text-white font-black text-sm uppercase tracking-widest hover:bg-blue-950 transition-all active:scale-95 shadow-lg shadow-blue-900/10">
                    Start Sharing <Play size={16} fill="white" className="inline ml-2" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {[
              { label: 'Viewers', value: viewers.length, icon: <Users size={18} /> },
              { label: 'Latency', value: 'Ultra-Low', icon: <Zap size={18} /> },
              { label: 'Protocol', value: 'P2P Link', icon: <Globe size={18} /> }
            ].map((s, i) => (
              <div key={i} className="bg-white p-5 border border-slate-200 flex items-center gap-4">
                <div className="text-blue-900">{s.icon}</div>
                <div>
                  <div className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">{s.value}</div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {pendingRequests.length > 0 && (
            <div className="bg-blue-900 p-5 text-white shadow-sm">
              <h3 className="font-black uppercase tracking-widest text-[9px] mb-5">Join Requests ({pendingRequests.length})</h3>
              <div className="space-y-4">
                {pendingRequests.map(r => (
                  <div key={r.id} className="bg-white p-4 border border-blue-800 text-slate-900">
                    <div className="text-[10px] font-black truncate mb-4">{r.email}</div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAcceptRequest(r)} className="flex-1 py-1.5 bg-blue-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-blue-950">Accept</button>
                      <button onClick={() => handleRejectRequest(r.id)} className="flex-1 py-1.5 bg-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-widest hover:bg-slate-200">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="bg-white border border-slate-200 p-5 h-full min-h-[400px]">
            <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400 mb-8 italic tracking-[0.2em]">Authorized Nodes</h3>
            <div className="space-y-3">
              {viewers.length > 0 ? viewers.map(v => (
                <div key={v.id} className="p-3 bg-slate-50 border border-slate-100 flex items-center justify-between group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-7 h-7 bg-blue-900 flex items-center justify-center text-white text-[9px] font-black uppercase">{v.email[0]}</div>
                    <div className="text-[10px] font-black text-slate-700 truncate">{v.email}</div>
                  </div>
                  <button onClick={() => handleKick(v.id)} className="p-1 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><X size={14} /></button>
                </div>
              )) : (
                <div className="text-center py-20 border border-dashed border-slate-100">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Awaiting Join</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Host;
