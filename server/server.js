const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Serve frontend
app.use(express.static(path.join(__dirname, '../public')));

// In-memory room & user state
const rooms = {}; // roomId -> Set of socket IDs
const users = {}; // socketId -> { name, roomId }

io.on('connection', (socket) => {
  console.log('✅ Connected:', socket.id);

  // ── JOIN ROOM ──
  socket.on('join-room', ({ roomId, userName }) => {
    socket.join(roomId);
    users[socket.id] = { name: userName, roomId };

    if (!rooms[roomId]) rooms[roomId] = new Set();
    rooms[roomId].add(socket.id);

    // Tell the new user about all existing peers in room
    const peers = [...rooms[roomId]].filter(id => id !== socket.id);
    socket.emit('room-peers', peers.map(id => ({ peerId: id, name: users[id]?.name || 'Unknown' })));

    // Tell existing peers about new user
    socket.to(roomId).emit('peer-joined', { peerId: socket.id, name: userName });

    console.log(`👤 ${userName} joined room ${roomId} (${rooms[roomId].size} users)`);
  });

  // ── WebRTC SIGNALING ──
  socket.on('offer', ({ to, offer }) => {
    socket.to(to).emit('offer', { from: socket.id, offer });
  });

  socket.on('answer', ({ to, answer }) => {
    socket.to(to).emit('answer', { from: socket.id, answer });
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    socket.to(to).emit('ice-candidate', { from: socket.id, candidate });
  });

  // ── CHAT ──
  socket.on('chat-message', ({ roomId, message }) => {
    const sender = users[socket.id];
    if (!sender) return;
    io.to(roomId).emit('chat-message', {
      from: socket.id,
      name: sender.name,
      message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  });

  // ── MEDIA STATE ──
  socket.on('media-state', ({ roomId, audio, video }) => {
    socket.to(roomId).emit('peer-media-state', { peerId: socket.id, audio, video });
  });

  // ── SCREEN SHARE ──
  socket.on('screen-share-started', ({ roomId }) => {
    socket.to(roomId).emit('peer-screen-share', { peerId: socket.id, sharing: true });
  });
  socket.on('screen-share-stopped', ({ roomId }) => {
    socket.to(roomId).emit('peer-screen-share', { peerId: socket.id, sharing: false });
  });

  // ── DISCONNECT ──
  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      const { roomId } = user;
      if (rooms[roomId]) {
        rooms[roomId].delete(socket.id);
        if (rooms[roomId].size === 0) delete rooms[roomId];
      }
      socket.to(roomId).emit('peer-left', { peerId: socket.id, name: user.name });
      delete users[socket.id];
    }
    console.log('❌ Disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 AIPL Connect server running on port ${PORT}`));
