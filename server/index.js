const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Store room information
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create a room (Host)
  socket.on('create-room', ({ roomCode, hostEmail }) => {
    socket.join(roomCode);
    rooms.set(roomCode, { host: socket.id, hostEmail, viewers: [] });
    console.log(`Room created: ${roomCode} by ${socket.id} (${hostEmail})`);
  });

  // Join Request (Viewer)
  socket.on('join-request', ({ roomCode, email }) => {
    if (rooms.has(roomCode)) {
      const room = rooms.get(roomCode);
      
      // Prevent duplicate requests from same socket
      if (room.viewers.some(v => v.id === socket.id)) return;
      
      // Notify host about the request
      io.to(room.host).emit('new-join-request', { id: socket.id, email });
      console.log(`Join request from ${email} for room ${roomCode}`);
    } else {
      socket.emit('error', { message: 'Room not found' });
    }
  });

  // Accept Viewer (Host)
  socket.on('accept-viewer', ({ roomCode, viewerId, email }) => {
    if (rooms.has(roomCode)) {
      const room = rooms.get(roomCode);
      socket.to(viewerId).emit('request-accepted', { hostEmail: room.hostEmail });
      
      if (room.viewers.some(v => v.id === viewerId)) return;

      const viewerData = { id: viewerId, email };
      room.viewers.push(viewerData);
      
      // Notify host UI to add to active list
      socket.emit('viewer-joined', viewerData);
      console.log(`Viewer ${email} accepted into room ${roomCode}`);
    }
  });

  // Reject Viewer (Host)
  socket.on('reject-viewer', ({ viewerId }) => {
    io.to(viewerId).emit('request-rejected');
  });

  // Kick Viewer
  socket.on('kick-viewer', ({ roomCode, viewerId }) => {
    io.to(viewerId).emit('kicked');
    console.log(`Viewer ${viewerId} kicked from room ${roomCode}`);
  });

  // WebRTC Signaling
  socket.on('offer', ({ to, offer }) => {
    io.to(to).emit('offer', { from: socket.id, offer });
  });

  socket.on('answer', ({ to, answer }) => {
    io.to(to).emit('answer', { from: socket.id, answer });
  });

  socket.on('viewer-ready', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (room) {
      io.to(room.host).emit('viewer-ready', { from: socket.id });
    }
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('ice-candidate', { from: socket.id, candidate });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Cleanup rooms
    for (const [roomCode, room] of rooms.entries()) {
      if (room.host === socket.id) {
        io.to(roomCode).emit('host-disconnected');
        rooms.delete(roomCode);
        console.log(`Room ${roomCode} closed because host disconnected`);
      } else {
        const index = room.viewers.findIndex(v => v.id === socket.id);
        if (index !== -1) {
          room.viewers.splice(index, 1);
          io.to(room.host).emit('viewer-left', { viewerId: socket.id });
        }
      }
    }
  });
});

app.get('/', (req, res) => {
  res.send('NikkiSky Signaling Server is running...');
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
