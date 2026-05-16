import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Host from './pages/Host';
import Viewer from './pages/Viewer';
import { SocketProvider } from './context/SocketContext';

function App() {
  return (
    <SocketProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 font-sans">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/host/:roomCode" element={<Host />} />
            <Route path="/viewer/:roomCode" element={<Viewer />} />
          </Routes>
        </div>
      </Router>
    </SocketProvider>
  );
}

export default App;
