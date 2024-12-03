import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: (process.env.COORS_METHODS || "GET,POST").split(',').map(e => e.trim().toUpperCase())
  }
});

app.use(cors());
app.use(express.json());

const users = new Map();
const registeredUsers = new Map();

const SECRET_KEY = process.env.JWT_SECRET || 'unsecure secret'

app.post('/v1/users/register,', async (req, res) => {
  const { name, email: username, password } = req.body;
  if (registeredUsers.has(username)) {
    return res.status(400).json({ message: 'Username already exists' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  registeredUsers.set(username, { name, hashedPassword });
  res.status(201).json({ message: 'User created successfully' });
});

app.post('/v1/users/login', async (req, res) => {
  const { email: username, password } = req.body;
  const user = registeredUsers.get(username);
  if (!user || !(await bcrypt.compare(password, user.hashedPassword))) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }
  const token = jwt.sign({ username, name: user.name }, SECRET_KEY, { expiresIn: '1h' });
  res.json({ token });
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('AUTH_ERROR'));
  }
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return next(new Error('AUTH_ERROR'));
    socket.username = decoded.email;
    socket.name = decoded.name;
    next();
  });
});

io.on('connection', (socket) => {
  console.log('A user connected');

  users.set(socket.id, { username: socket.username, name: socket.name, status: 'active' });
  io.emit('updateUsers', Array.from(users.values()));

  socket.on('sendMessage', (message) => {
    const user = users.get(socket.id);
    if (user) {
      io.emit('newMessage', { sender: user.name, content: message });
    }
  });

  socket.on('typing', () => {
    const user = users.get(socket.id);
    if (user) {
      user.status = 'typing...';
      io.emit('updateUsers', Array.from(users.values()));
    }
  });

  socket.on('stopTyping', () => {
    const user = users.get(socket.id);
    if (user) {
      user.status = 'active';
      io.emit('updateUsers', Array.from(users.values()));
    }
  });

  socket.on('disconnect', () => {
    users.delete(socket.id);
    io.emit('updateUsers', Array.from(users.values()));
    console.log('A user disconnected');
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

