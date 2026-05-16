import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { Monitor, Loader2, Maximize2, Minimize2, Volume2, VolumeX, Shield, Users, RefreshCw, Zap, Globe, Lock } from 'lucide-react';

const Viewer = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [hostEmail, setHostEmail] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);
  const pc = useRef(null);
  const containerRef = useRef(null);
  const requestSent = useRef(false);

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject"
      },
      {
        urls: "turn:openrelay.metered.ca:443",
        username: "openrelayproject",
        credential: "openrelayproject"
      },
      {
        urls: "turn:openrelay.metered.ca:443?transport=tcp",
        username: "openrelayproject",
        credential: "openrelayproject"
      }
    ]
  };

  const initWebRTC = () => {
    if (!socket || !roomCode) return;
    socket.emit('viewer-ready', { roomCode });
    setLoading(true);
    setStream(null);
  };

  useEffect(() => {
    if (!socket || !roomCode) return;
    const query = new URLSearchParams(location.search);
    const email = query.get('email');
    if (!email) {
      setError('Email required to join');
      setLoading(false);
      return;
    }
    setUserEmail(email);

    if (!requestSent.current) {
      socket.emit('join-request', { roomCode, email });
      requestSent.current = true;
    }

    socket.on('request-accepted', ({ hostEmail }) => {
      setLoading(true);
      setError(null);
      if (hostEmail) setHostEmail(hostEmail);
      initWebRTC();
    });

    socket.on('request-rejected', () => {
      setError('Access Denied');
      setLoading(false);
    });

    socket.on('kicked', () => {
      setError('Session Terminated');
      setStream(null);
      if (pc.current) pc.current.close();
    });

    socket.on('offer', async ({ from, offer }) => {
      console.log("Offer received");
      if (pc.current) pc.current.close();
      
      pc.current = new RTCPeerConnection(iceServers);
      
      pc.current.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit('ice-candidate', { to: from, candidate: e.candidate });
        }
      };

      pc.current.ontrack = (e) => {
        console.log("Stream received");
        if (e.streams && e.streams[0]) {
          setStream(e.streams[0]);
          setLoading(false);
        }
      };

      try {
        await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answer);
        socket.emit('answer', { to: from, answer });
      } catch (err) { 
        console.error("WebRTC Error:", err);
      }
    });

    socket.on('ice-candidate', async ({ from, candidate }) => {
      if (pc.current) {
        try {
          await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) { console.error("ICE Error:", err); }
      }
    });

    return () => {
      socket.off('request-accepted');
      socket.off('request-rejected');
      socket.off('kicked');
      socket.off('offer');
      socket.off('ice-candidate');
      if (pc.current) pc.current.close();
    };
  }, [socket, roomCode, location.search]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => setIsMuted(true));
    }
  }, [stream]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 h-14 fixed top-0 w-full z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-blue-900 flex items-center justify-center text-white font-black text-sm">N</div>
          <div className="flex flex-col">
            <h1 className="text-xs font-black uppercase tracking-widest leading-none">
              <span className="text-slate-900">Nikki</span>
              <span className="text-blue-900">Sky</span>
            </h1>
            <span className="text-[9px] font-black text-blue-900 uppercase tracking-widest leading-none mt-1">Host: {hostEmail || 'Connecting...'}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={initWebRTC} className="p-2 text-slate-400 hover:text-blue-900 transition-colors">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => navigate('/')} className="px-5 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-blue-900 transition-all">Exit Node</button>
        </div>
      </header>

      <main className="pt-20 pb-10 px-6 max-w-[1400px] mx-auto h-[calc(100vh-100px)]">
        <div className="bg-white border border-slate-200 h-full flex flex-col relative overflow-hidden shadow-sm">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-white z-10">
            <div className="flex flex-col">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Node ID: {roomCode}</h2>
              <p className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">Verified: {userEmail}</p>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={() => setIsMuted(!isMuted)} className="text-slate-400 hover:text-blue-900">
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <button onClick={toggleFullscreen} className="text-slate-400 hover:text-blue-900">
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>

          <div ref={containerRef} className="flex-grow bg-[#0f172a] relative flex items-center justify-center overflow-hidden">
            {loading && !error ? (
              <div className="flex flex-col items-center gap-6 text-center p-8">
                <Loader2 className="w-10 h-10 text-blue-900 animate-spin" />
                <p className="text-white font-black uppercase tracking-[0.2em] text-[11px] mb-2 leading-none">Tunneling Data...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-6 text-center p-8">
                <Lock size={32} className="text-red-500 mb-4" />
                <h3 className="text-xl font-black text-white uppercase tracking-tight">{error}</h3>
                <button onClick={() => navigate('/')} className="px-8 py-3 bg-blue-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-blue-950">Back Home</button>
              </div>
            ) : (
              <video 
                ref={videoRef} 
                autoPlay 
                muted={isMuted} 
                playsInline 
                className="w-full h-full object-contain" 
              />
            )}
          </div>
          
          <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-center gap-10">
             <div className="flex items-center gap-2 text-slate-400">
                <Shield size={14} className="text-blue-900" />
                <span className="text-[9px] font-black uppercase tracking-widest leading-none">Secure Encryption</span>
             </div>
             <div className="flex items-center gap-2 text-slate-400">
                <Globe size={14} className="text-blue-900" />
                <span className="text-[9px] font-black uppercase tracking-widest leading-none">P2P Network</span>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Viewer;
