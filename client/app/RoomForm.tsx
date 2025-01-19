"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import SocketService from "@/service/SocketService";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

export const RoomForm = () => {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [inputError, setInputError] = useState(false);

  const { toast } = useToast();

  const router = useRouter();

  useEffect(() => {
    const socket = SocketService.getInstance().connect();

    socket.on("user-joined", (userId) => {
      console.log("User joined:", userId);
    });

    socket.on("user-left", (userId) => {
      console.log("User left:", userId);
    });

    return () => {
      //  removing this because the connection has to be there when routing
      // rooms page
      //   SocketService.getInstance().disconnect();
    };
  }, []);

  const handleJoinRoom = async (e: FormEvent) => {
    e.preventDefault();
    if (roomCode?.length !== 6) {
      setInputError(true);
      return;
    }
    router.push(`/room/${roomCode}`)
  };

  const handleCreateRoom = async () => {
    router.push('room/new')
  };

  return (
    <>
      <div className="flex flex-col justify-center items-center">
        <h4 className="text-6xl font-bold -mt-10">Hello, idiot!</h4>
        <Button onClick={handleCreateRoom} className="mt-10">
          Create room
        </Button>
        <div className="text-muted-foreground mt-4 text-center">- OR -</div>
        <form onSubmit={handleJoinRoom}>
          <div className="flex w-full max-w-sm items-start space-x-2 mt-4">
            <div className="flex flex-col">
              <Input
                type="text"
                placeholder="Join with a room code"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setInputError(false);
                  const value = e.target.value.toUpperCase();
                  setRoomCode(value);
                }}
                value={roomCode || ""}
                maxLength={6}
                className={inputError ? "border-red-400" : ""}
              />
              {inputError && (
                <span className="text-sm text-muted-foreground mt-1 text-red-400">
                  <i>Enter full code</i>
                </span>
              )}
            </div>
            <Button type="submit">Join</Button>
          </div>
        </form>
      </div>
    </>
  );
};
