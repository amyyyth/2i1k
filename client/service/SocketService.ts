// socketService.ts
import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;
  private static instance: SocketService;
  private connectedRoom: string | null = null;

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  connect() {
    this.socket = io("http://localhost:4000");

    this.socket.on("connect", () => {
      console.log("Connected to server");
    });

    this.socket.on("error", (error: unknown) => {
      if (error instanceof Error) {
        console.error("Socket error:", error);
      }
    });

    return this.socket;
  }

  getSocket() {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    return this.socket;
  }

  createRoom(): Promise<{
    success: boolean;
    roomCode?: string;
    error?: string;
  }> {
    return new Promise((resolve) => {
      this.getSocket().emit("create-room", resolve);
    });
  }

  joinRoom(roomCode: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      this.getSocket().emit("join-room", roomCode, resolve);
    });
  }

  contentUpdate(content: string) {
    try{
      this.getSocket().emit("content-change", {
        roomCode: this.connectedRoom,
        content: content,
      });
    }
    catch(err){
      console.log(err)
    }
  }

  switchControl() {
    try{
      this.getSocket().emit("switch-control", this.connectedRoom);
    }
    catch(err){
      console.log(err)
    }
  }

  setConnectedRoom(roomCode: string | null) {
    this.connectedRoom = roomCode;
  }

  getConnectedRoom() {
    return this.connectedRoom;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default SocketService;
