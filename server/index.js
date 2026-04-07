import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Virtual Cosmos API');
});

// Real-time memory state
const users = new Map();

const PROXIMITY_RADIUS = 100;
const TICK_RATE = 1000 / 30; // 30fps

// Active chat rooms mapping pairs to a room name
const activeRooms = new Map();

function getDistance(u1, u2) {
  return Math.sqrt(Math.pow(u1.x - u2.x, 2) + Math.pow(u1.y - u2.y, 2));
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Default values
  users.set(socket.id, {
    id: socket.id,
    x: 400 + Math.random() * 100, // spawn somewhere near middle
    y: 300 + Math.random() * 100,
    color: '#' + Math.floor(Math.random()*16777215).toString(16),
    name: 'Player_' + socket.id.substring(0, 4)
  });

  // Share current users with the new user
  socket.emit('initUsers', Array.from(users.values()));

  // Broadcast the new user to everyone
  socket.broadcast.emit('userJoined', users.get(socket.id));

  socket.on('move', (data) => {
    const user = users.get(socket.id);
    if (user) {
      user.x = data.x;
      user.y = data.y;
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    users.delete(socket.id);
    io.emit('userLeft', socket.id);
    
    // Clean up rooms
    for (const [roomCode, data] of activeRooms.entries()) {
      if (data.users.includes(socket.id)) {
        activeRooms.delete(roomCode);
        io.to(roomCode).emit('roomDestroyed');
      }
    }
  });

  socket.on('chatMessage', (msg) => {
    let userRoom = null;
    for (const [roomCode, data] of activeRooms.entries()) {
      if (data.users.includes(socket.id)) {
        userRoom = roomCode;
        break;
      }
    }
    
    if (userRoom) {
      io.to(userRoom).emit('chatMessage', {
        sender: users.get(socket.id).name,
        senderId: socket.id,
        text: msg,
        timestamp: new Date()
      });
    }
  });
});

// Proximity Loop
setInterval(() => {
  const userList = Array.from(users.values());
  
  // Broadcast all positions periodically
  io.emit('positionsUpdate', userList);

  // Check proximity between all pairs
  for (let i = 0; i < userList.length; i++) {
    for (let j = i + 1; j < userList.length; j++) {
      const u1 = userList[i];
      const u2 = userList[j];
      const dist = getDistance(u1, u2);

      const roomCode = [u1.id, u2.id].sort().join('-');
      
      if (dist < PROXIMITY_RADIUS) {
        if (!activeRooms.has(roomCode)) {
          console.log(`Connecting ${u1.id} and ${u2.id} (dist: ${dist})`);
          // Connect them
          const socket1 = io.sockets.sockets.get(u1.id);
          const socket2 = io.sockets.sockets.get(u2.id);
          
          if (socket1 && socket2) {
            socket1.join(roomCode);
            socket2.join(roomCode);
            activeRooms.set(roomCode, { users: [u1.id, u2.id] });
            
            io.to(roomCode).emit('userConnected', { roomCode, connectedWith: [u1.id, u2.id] });
          } else {
            console.log('Sockets not found for connection!', !!socket1, !!socket2);
          }
        }
      } else {
        if (activeRooms.has(roomCode)) {
          console.log(`Disconnecting ${u1.id} and ${u2.id} (dist: ${dist})`);
          // Disconnect them
          const socket1 = io.sockets.sockets.get(u1.id);
          const socket2 = io.sockets.sockets.get(u2.id);
          
          if (socket1) socket1.leave(roomCode);
          if (socket2) socket2.leave(roomCode);
          activeRooms.delete(roomCode);
          
          io.to(u1.id).emit('userDisconnected', { roomCode });
          io.to(u2.id).emit('userDisconnected', { roomCode });
        }
      }
    }
  }
}, TICK_RATE);

const PORT = Math.floor(process.env.PORT) || 3001;
server.listen(PORT, () => {
  console.log('Server listening on port', PORT);
});
