import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
  const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
  ].filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        const isLocalDevOrigin = /^http:\/\/(localhost|127\.0\.0\.1):517[0-9]$/.test(origin);
        if (isLocalDevOrigin) {
          callback(null, true);
          return;
        }

        callback(new Error("Not allowed by Socket.IO CORS"));
      },
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('⚡ Client connected:', socket.id);

    // Allow client to join user room after authentication on client side
    socket.on('join', (data) => {
      try {
        const { userId } = data || {};
        if (userId) {
          socket.join(`user:${userId}`);
          console.log(`Socket ${socket.id} joined room user:${userId}`);
        }
      } catch (e) {
        console.error('Socket join error', e);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};
