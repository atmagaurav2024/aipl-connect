const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, '../public')));

// ── REGISTERED USERS (persisted in memory; use a DB for production) ──
// { employeeId -> { employeeId, name, passwordHash } }
const registeredUsers = {};

// ── ONLINE USERS ──
// { socketId -> { employeeId, name } }
const onlineUsers = {};

const REG_PASSWORD = 'Atmagaurav@123';

function broadcastUserList() {
  const list = Object.values(onlineUsers).map(u => ({
    socketId: u.socketId,
    employeeId: u.employeeId,
    name: u.name
  }));
  io.emit('user-list', list);
}

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  // ── REGISTER ──
  socket.on('register', ({ employeeId, name, password }) => {
    if (password !== REG_PASSWORD) {
      socket.emit('register-result', { success: false, message: 'Incorrect registration password.' });
      return;
    }
    if (!employeeId || !name) {
      socket.emit('register-result', { success: false, message: 'Employee ID and Name are required.' });
      return;
    }
    if (registeredUsers[employeeId]) {
      socket.emit('register-result', { success: false, message: 'Employee ID already registered.' });
      return;
    }
    registeredUsers[employeeId] = { employeeId, name };
    socket.emit('register-result', { success: true, message: 'Registration successful! You can now log in.' });
    console.log(`Registered: ${name} (${employeeId})`);
  });

  // ── LOGIN ──
  socket.on('login', ({ employeeId, password }) => {
    if (password !== REG_PASSWORD) {
      socket.emit('login-result', { success: false, message: 'Incorrect password.' });
      return;
    }
    const user = registeredUsers[employeeId];
    if (!user) {
      socket.emit('login-result', { success: false, message: 'Employee ID not registered.' });
      return;
    }
    // Check not already logged in from another socket
    const existing = Object.values(onlineUsers).find(u => u.employeeId === employeeId);
    if (existing) {
      // Kick old session
      io.to(existing.socketId).emit('kicked', { message: 'Logged in from another device.' });
      delete onlineUsers[existing.socketId];
    }
    onlineUsers[socket.id] = { socketId: socket.id, employeeId, name: user.name };
    socket.emit('login-result', { success: true, user: { employeeId, name: user.name } });
    broadcastUserList();
    console.log(`Login: ${user.name} (${employeeId})`);
  });

  // ── DIRECT CALL SIGNALING ──
  socket.on('call-user', ({ to, offer }) => {
    const caller = onlineUsers[socket.id];
    if (!caller) return;
    io.to(to).emit('incoming-call', {
      from: socket.id,
      callerName: caller.name,
      callerEmpId: caller.employeeId,
      offer
    });
  });

  socket.on('call-answered', ({ to, answer }) => {
    io.to(to).emit('call-answered', { from: socket.id, answer });
  });

  socket.on('call-rejected', ({ to }) => {
    const user = onlineUsers[socket.id];
    io.to(to).emit('call-rejected', { from: socket.id, name: user?.name });
  });

  socket.on('call-ended', ({ to }) => {
    io.to(to).emit('call-ended', { from: socket.id });
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('ice-candidate', { from: socket.id, candidate });
  });

  // ── MEDIA STATE ──
  socket.on('media-state', ({ to, audio, video }) => {
    io.to(to).emit('peer-media-state', { audio, video });
  });

  // ── SCREEN SHARE ──
  socket.on('screen-share-started', ({ to }) => {
    io.to(to).emit('peer-screen-share', { sharing: true });
  });
  socket.on('screen-share-stopped', ({ to }) => {
    io.to(to).emit('peer-screen-share', { sharing: false });
  });

  // ── CHAT ──
  socket.on('chat-message', ({ to, message }) => {
    const sender = onlineUsers[socket.id];
    if (!sender) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    io.to(to).emit('chat-message', { from: socket.id, name: sender.name, message, time });
    // echo back to sender
    socket.emit('chat-message', { from: socket.id, name: sender.name, message, time, self: true });
  });

  // ── DISCONNECT ──
  socket.on('disconnect', () => {
    const user = onlineUsers[socket.id];
    if (user) {
      console.log(`Offline: ${user.name}`);
      delete onlineUsers[socket.id];
      broadcastUserList();
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 AIPL Connect running on port ${PORT}`));
