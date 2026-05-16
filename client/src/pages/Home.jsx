import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, Play, Users, ArrowRight, Shield, Globe, Lock, Zap, CheckCircle2, Menu, X, Phone, Cpu, Laptop, Smartphone, Command, Layers, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
  const [roomCode, setRoomCode] = useState('');
  const [email, setEmail] = useState('');
  const [hostEmail, setHostEmail] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (hostEmail.trim()) {
      const code = `NK-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      navigate(`/host/${code}?email=${encodeURIComponent(hostEmail)}`);
    } else {
      alert("Please enter your email to start hosting.");
    }
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (roomCode.trim() && email.trim()) {
      navigate(`/viewer/${roomCode.toUpperCase()}?email=${encodeURIComponent(email)}`);
    } else {
      alert("Please enter both email and room code.");
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white z-50 border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-900 flex items-center justify-center text-white font-black text-xl">N</div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter leading-none">
                <span className="text-slate-900">Nikki</span>
                <span className="text-blue-900">Sky</span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-0.5">Enterprise</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-10 font-bold text-xs text-slate-500 uppercase tracking-widest">
            <a href="#features" className="hover:text-blue-900">Features</a>
            <a href="#pricing" className="hover:text-blue-900">Pricing</a>
            <a href="#contact" className="hover:text-blue-900">Contact</a>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            <span className="text-lg font-black text-slate-900">+91 870430208</span>
            <button className="bg-slate-900 text-white px-8 py-3 font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors">Console</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-slate-50 relative overflow-hidden border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-block px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-8">
              Protocol v2.4 Live
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-slate-900 leading-[0.9] mb-10 tracking-tighter">
              Remote <br/> <span className="text-blue-900">Mastery.</span>
            </h1>
            <p className="text-slate-500 text-xl mb-12 leading-relaxed max-w-lg font-medium">
              Ultra-low latency screen sharing for the modern enterprise. Zero configuration, military-grade security.
            </p>
            
            {/* Host Form */}
            <div className="bg-white p-8 border border-slate-200 shadow-sm max-w-md">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 font-medium">Start Hosting</h3>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <input 
                  type="email" 
                  placeholder="Host Email ID"
                  value={hostEmail}
                  onChange={(e) => setHostEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 py-4 px-6 text-slate-800 focus:outline-none focus:border-blue-900 font-bold"
                />
                <button type="submit" className="w-full py-4 bg-blue-900 text-white font-black uppercase tracking-widest text-sm hover:bg-blue-950 transition-all shadow-sm">
                  Create Private Room
                </button>
              </form>
            </div>
          </div>

          {/* Join Form */}
          <div className="bg-white p-10 md:p-14 border border-slate-900 shadow-xl">
            <div className="mb-10">
              <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Join Session</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Secure Handshake Node</p>
            </div>
            
            <form onSubmit={handleJoinRoom} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Viewer Identity</label>
                <input 
                  type="email" 
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 py-4 px-6 text-slate-800 focus:outline-none focus:border-blue-900 font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Key</label>
                <input 
                  type="text" 
                  placeholder="NK-XXXX"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 py-4 px-6 text-slate-800 focus:outline-none focus:border-blue-900 uppercase font-mono tracking-widest font-black text-lg"
                />
              </div>
              <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black text-sm uppercase tracking-[0.2em] hover:bg-blue-900 transition-all">
                Connect To Node
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 grid md:grid-cols-3 gap-0 border border-slate-200">
          {[
            { icon: <Zap />, title: "0.03s Latency", desc: "Proprietary P2P tunneling technology." },
            { icon: <Shield />, title: "AES-256", desc: "Military grade end-to-end encryption." },
            { icon: <Globe />, title: "Universal", desc: "Works in any browser, zero downloads." }
          ].map((f, i) => (
            <div key={i} className="p-12 border-r border-slate-200 last:border-0 hover:bg-slate-50 transition-colors">
              <div className="text-blue-900 mb-6">{f.icon}</div>
              <h3 className="text-xl font-black mb-2 uppercase tracking-tight">{f.title}</h3>
              <p className="text-slate-500 text-sm font-medium">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-md mx-auto bg-white border border-slate-900 p-12 text-center shadow-lg">
          <h4 className="text-blue-900 font-black uppercase tracking-widest text-xs mb-4">Pricing Plan</h4>
          <div className="flex items-baseline justify-center gap-1 mb-8">
            <span className="text-6xl font-black">₹89</span>
            <span className="text-slate-400 font-black uppercase text-xs">/month</span>
          </div>
          <ul className="text-left space-y-4 mb-10">
            {["Unlimited Sessions", "4K High Resolution", "Priority Support", "E2EE Security"].map((t, i) => (
              <li key={i} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-600">
                <CheckCircle2 size={16} className="text-blue-900" /> {t}
              </li>
            ))}
          </ul>
          <button className="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-sm hover:bg-blue-900 transition-colors">Select Plan</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-900 flex items-center justify-center text-white font-black text-lg">N</div>
            <span className="text-2xl font-black tracking-tighter">
              <span className="text-slate-900">Nikki</span>
              <span className="text-blue-900">Sky</span>
            </span>
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
            © 2026 NikkiSky Tech • Enterprise Division
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
