import cors from "cors";
import express, { Request, Response } from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Allow requests from your frontend
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

type RoomData = {
  users: string[];
  content: string;
  currentController: string | null;
};

const rooms: Record<string, RoomData> = {};

// Generate random 6-letter room code
function generateRoomCode() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Generate unique room code
function getUniqueRoomCode() {
  let roomCode;
  do {
    roomCode = generateRoomCode();
  } while (roomCode in rooms);
  return roomCode;
}

app.get("/", (req: Request, res: Response) => {
  res.send("Server is running");
});

io.on("connection", (socket) => {
  socket.on("create-room", (callback) => {
    const roomCode = getUniqueRoomCode();
    rooms[roomCode] = { users: [], content: "", currentController: null };
    const room = rooms[roomCode];
    room.users.push(socket.id);
    if (room.currentController === null) room.currentController = socket.id;
    socket.join(roomCode);
    callback({ success: true, roomCode });
  });

//   socket.on("join-room", (roomCode: string, callback) => {
//     if (!rooms[roomCode]) {
//       rooms[roomCode] = { users: [], content: "", currentController: null };
//     }

//     const room = rooms[roomCode];
//     if (room.users.length >= 2) {
//       io.emit("room-full");
//     }
//     room.users.push(socket.id);
//     if (room.currentController === null) room.currentController = socket.id;

//     socket.join(roomCode);
//     io.to(roomCode).emit("room-update", room);
//   });

  socket.on("join-room", (roomCode, callback) => {
    // Check if room exists
    if (!rooms[roomCode]) {
      callback({ success: false, error: "Room does not exist" });
      return;
    }

    const room = rooms[roomCode];

    if (room.users.length >= 2) {
      io.emit("room-full");
      callback({ success: false, error: "Room is full" });
      return
    }
    room.users.push(socket.id);
    if (room.currentController === null) room.currentController = socket.id;

    socket.join(roomCode);
    callback({ success: true });
    io.to(roomCode).emit("room-update", room);
    console.log(rooms)
  });

  socket.on("leave-room", (roomCode, callback) => {
    // Check if room exists
    if (!rooms[roomCode]) {
      callback({ success: false, error: "Room does not exist" });
      return;
    }

    const room = rooms[roomCode];

    if (room.users.length >= 2) {
      io.emit("room-full");
      callback({ success: false, error: "Room is full" });
      return
    }
    // Remove user from room
    room.users = room.users.filter((id) => id !== socket.id);

    // If the user leaving was the current controller, assign a new controller
    if (room.currentController === socket.id) {
      room.currentController = room.users[0] || null;
    }

    // If there are no users left, delete the room
    if (room.users.length === 0) {
      delete rooms[roomCode];
      callback({ success: true, message: "Room deleted" });
    } else {
      socket.leave(roomCode);
      callback({ success: true, message: "User left the room" });
      io.to(roomCode).emit("room-update", room);
    }
    console.log(rooms);
  });

  socket.on(
    "content-change",
    ({ roomCode, content }: { roomCode: string; content: string }) => {
      if (rooms[roomCode]) {
        rooms[roomCode].content = content;
        socket.to(roomCode).emit("update-content", content);
      }
    }
  );

  socket.on("switch-control", (roomCode: string) => {
    console.log("switch", roomCode)
    const room = rooms[roomCode];
    if (room) {
      const currentIndex = room.users.indexOf(room.currentController!);
      room.currentController =
        room.users[(currentIndex + 1) % room.users.length];
      io.to(roomCode).emit("control-update", room.currentController);
    }
  });

  socket.on("disconnect", () => {
    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      room.users = room.users.filter((id) => id !== socket.id);
      if (room.currentController === socket.id) {
        room.currentController = room.users[0] || null;
      }
      io.to(roomCode).emit("room-update", room);
      if (room.users.length === 0) delete rooms[roomCode];
    }
  });
});

server.listen(4000, () =>
  console.log("Server is running on http://localhost:4000")
);
