// socketService.ts
import { io, Socket } from "socket.io-client";
import { QuestionData } from "./LeetCodeService";

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
    console.log(process.env.NEXT_PUBLIC_BACKEND_URI)
    this.socket = io(process.env.NEXT_PUBLIC_BACKEND_URI);

    this.socket.on("connect", () => {
      console.log("Connected to server");
    });

    this.socket.on("error", (error: unknown) => {
      if (error instanceof Error) {
        console.error("Socket error:", error);
        throw error;
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
      console.log("emit")
      console.log(content)
      this.getSocket().emit("content-change", {
        roomCode: this.connectedRoom,
        content: content,
      });
    }
    catch(err){
      console.log(err)
    }
  }
  
  questionUpdate(question: QuestionData) {
    try{
      this.getSocket().emit("question-change", {
        roomCode: this.connectedRoom,
        question: question,
      });
    }
    catch(err){
      console.log(err)
    }
  }

  langChange(lang: string) {
    try{
      this.getSocket().emit("lang-change", {
        roomCode: this.connectedRoom,
        lang: lang,
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
