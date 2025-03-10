import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { initializeSocket } from './sockets/socketManager';

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
      origin: "https://chatapp-one-rust.vercel.app", // Allow frontend to connect
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

// Initialize Socket.IO
initializeSocket(io);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
