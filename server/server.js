const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const morgan = require('morgan');
const cors = require("cors");
const auth = require("./helper/auth");
const multer = require('multer');
const path = require('path');

const { chatServices } = require("./api/v1/services/chat");
const { messageServices } = require("./api/v1/services/message");
const { notificationServices } = require("./api/v1/services/notification");
const DepositController = require("./api/v1/controllers/blockchain/deposit");
const WithdrawCron = require("./cronJob/processAprrovedWithdrawals");
const DepositCron = require("./cronJob/processConfirmedDeposits");

const io = new Server(this.server, {
  cors: {
    origin: '*'
  }
});


class ExpressServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: '*'
      }
    });

    this.configureServer();
  }

  configureServer() {
    // Configure middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cors());
    this.app.disable('etag');
    this.app.use(morgan('tiny'));

    // Serve the React app (build) - assuming React app is in the 'build' folder
    this.app.use(express.static(path.join(__dirname, 'build')));

    // Set up Multer to handle file uploads
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Save files to the 'uploads' directory
      },
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
      },
    });

    this.upload = multer({ storage });

    // Handle file upload endpoints
    this.configureFileUpload('/upload/document1', 'document1');
    this.configureFileUpload('/upload/document2', 'document2');
    this.configureFileUpload('/uploadImage', 'image');
  }

  configureFileUpload(endpoint, field) {
    // Now use this.upload instead of upload
    this.app.post(endpoint, this.upload.single(field), (req, res) => {
      console.log('Req Body:', req.body);
      console.log(`Req File ${field}:`, req.file);

      const uploadedFile = req.file;
      console.log(`${field} uploaded:`, uploadedFile);
      // Handle further processing or save the file information to a database
      res.json({ message: `${field} uploaded successfully` });
    });
  }

  router(routes) {
    // Configure routes
    routes(this.app);
    return this;
  }

  async configureDb(dbUrl) {
    // Configure MongoDB connection
    try {
      await mongoose.connect(dbUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false
      });
      console.log("MongoDB connection established");
      return this;
    } catch (error) {
      console.log(`Error in MongoDB connection: ${error.message}`);
      throw error;
    }
  }

  listen(port) {
    // Start listening on the specified port
    this.server.listen(port, () => {
      console.log(`Secure app is listening @port ${port}`, new Date().toLocaleString());
    });
    return this.app;
  }

  socketLogin(socket, next) {
    // Handle socket authentication logic
    next();
  }
  start() {
    // Start cron jobs
    WithdrawCron.start();
    DepositCron.start();
    DepositController.start();
    return this;
  }
  
}

// Socket login middleware
const socketLogin = async (socket, next) => {
  try {
    if (token) {
      const user = await auth.verifyTokenBySocket(token);
      if (user) {
        socket.userID = user._id;
        socket.userName = user.userName;
      }
    } else {
      return next(new Error("Please Login"));
    }
  } catch (err){
    return next(new Error("unauthorized"));
  }
  next();
};

// Configure socket authentication
io.use(socketLogin);


global.NotifySocket = io.of("/notifications");
NotifySocket.use(socketLogin);
NotifySocket.on("connection", async (socket) => {
  const user = socket.userID.toString();
  socket.join(user);
  let unread = await notificationServices.notificationList({
    userId: user,
    status: { $ne: 'DELETE' },
    isRead: false,
  });
  if(unread && unread.length > 0){
    NotifySocket.to(user).emit('notification', unread);
  }
  socket.on("error", (err) => {
    socket.disconnect();
  });
});

global.onlineUsers = new Map();

io.sockets.on("connection", async (socket) => {
  const user = socket.userID.toString();
  console.log('new connection', socket.userName);
  console.log('online users', onlineUsers.size, [...onlineUsers.keys()])

  if (onlineUsers.has(user)) {
    onlineUsers.set(user, onlineUsers.get(user).add(socket.id));
  } else {
    onlineUsers.set(user, new Set([socket.id]));
    io.emit("notify", { onlineusers: [...onlineUsers.keys()] });
  }

  let joinChats = await chatServices.chatList(socket.userID, {});
  for (chat in joinChats) {
    socket.join(joinChats[chat]._id.toString())
  }

  socket.on("sendMsg", async (data) => {
    if (!socket.rooms.has(data.chat_id.toString())) {
      socket.join(data.chat_id.toString());
    }
    let msg = await messageServices.createMsg({
      chat: data.chat_id,
      sender: socket.userID,
      text: data.message,
      mediaType: data.mediaType || 'text'
    });
    io.to(data.chat_id).emit(data.chat_id, msg);
  });

  socket.on("ping", () => {
    io.to(socket.id).emit("notify", { onlineusers: [...onlineUsers.keys()] });
  });

  socket.on("disconnecting", () => {
    console.log(socket.rooms, 'disconnecting'); // the Set contains at least the socket ID
  });

  socket.on("disconnect", async () => {
    console.log(socket.userName, 'disconnect');
    onlineUsers.get(user).delete(socket.id);
    if (onlineUsers.get(user).size == 0) {
      onlineUsers.delete(user);
      io.emit("notify", { onlineusers: [...onlineUsers.keys()] });
    }
    console.log('online users', onlineUsers.size, [...onlineUsers.keys()])
  });

  socket.on("error", (err) => {
    socket.disconnect();
  });

});
WithdrawCron.start();
DepositCron.start();
DepositController.start();

module.exports = ExpressServer;
