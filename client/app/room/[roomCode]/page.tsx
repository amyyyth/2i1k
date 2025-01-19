"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import SocketService from "@/service/SocketService";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";

export const RoomPage = () => {
  const { roomCode } = useParams();
  type RoomData = {
    users: string[];
    content: string;
    currentController: string | null;
  };

  const [isInControl, setIsInControl] = useState(true);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [roomError, setRoomError] = useState(false);
  const [roomErrorMsg, setRoomErrorMsg] = useState("");

  const { toast } = useToast();
  const router = useRouter();

  const setControl = (controllerId: string) => {
    if (SocketService.getInstance().getSocket().id === controllerId) {
      setIsInControl(true);
      console.log("control is here");
    } else {
      setIsInControl(false);
      console.log("control gone");
    }
  };

  useEffect(() => {
    try {
      const socket = SocketService.getInstance().connect();
      if (!roomCode || roomCode === "new") {
        SocketService.getInstance()
          .createRoom()
          .then((result) => {
            if (result.success && result.roomCode) {
              console.log("room created ", result.roomCode);
              SocketService.getInstance().setConnectedRoom(result.roomCode);
            } else {
              console.log(result.error || "Failed to create room");
            }
          })
          .then(() => {
            setLoading(false);
          });
      } else {
        SocketService.getInstance()
          .joinRoom((roomCode as string).toUpperCase())
          .then((result) => {
            if (result.success) {
              console.log("connected to ", roomCode);
              SocketService.getInstance().setConnectedRoom(roomCode as string);
              // handle connected
            } else {
              SocketService.getInstance().setConnectedRoom(null);
              setRoomError(true);
              setRoomErrorMsg(result.error as string);
              console.log(result.error || "Failed to join room");
            }
          })
          .then(() => {
            setLoading(false);
          });
      }

      socket.on("room-update", (room: RoomData) => {
        console.log(room);
        setControl(room.currentController as string);
      });

      socket.on("control-update", (controllerId: string) => {
        setControl(controllerId);
      });

      socket.on("update-content", (content: string) => {
        setContent(content);
      });

      return () => {
        SocketService.getInstance().disconnect();
      };
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.log(e.message);
      }
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " " || e.key === "Enter") {
      console.log("emittt");
      SocketService.getInstance().switchControl();
    }
    if (e.key === "Enter") {
      console.log("enter pressed");
    }
  };

  const handleInputChange = (val: string) => {
    setContent(val);
    SocketService.getInstance().contentUpdate(val);
  };

  return (
    <>
      <div className="flex flex-col min-h-screen items-center justify-center">
        {loading ? (
          <LoadingSpinner size={50} />
        ) : roomError ? (
          <>
            <h2 className="text-3xl font-semibold">{roomErrorMsg}</h2>
            <Link href="/">
              <Button className="mt-2" variant={"outline"}>
                Go home
              </Button>
            </Link>
          </>
        ) : (
          <div className="">
            <div className="text-3xl mb-4">
              Connected to{" "}
              <span className="font-bold">
                {SocketService.getInstance().getConnectedRoom()}
              </span>
            </div>
            <Input
              placeholder="content here"
              value={content}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleInputChange(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                handleKeyDown(e)
              }
              readOnly={!isInControl}
              className={"focus:ring-0 "+(!isInControl ? "bg-red-400 bg-opacity-20" : "")}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default RoomPage;
