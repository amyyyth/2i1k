"use client";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import SocketService from "@/service/SocketService";
import { useParams, useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";

export const RoomPage = () => {
  const { roomCode } = useParams();
  type RoomData = {
    users: string[];
    content: string;
    currentController: string | null;
  };

  const [isInControl, setIsInControl] = useState(false);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const socket = SocketService.getInstance().connect();
    if (
      !SocketService.getInstance().getConnectedRoom() ||
      SocketService.getInstance().getConnectedRoom() !== roomCode
    ) {
      console.log("wrong room");
      toast({
        title: "Uh,oh!",
        description: "You came to the wrong room",
        variant: "destructive",
      });
      router.push("/");
    }
    else{
      setLoading(false)
    }
    socket.on("room-update", (room: RoomData) => {
      console.log(room);
    });

    socket.on("control-update", (controllerId: string) => {
      if (SocketService.getInstance().getSocket().id === controllerId) {
        console.log("control is here");
      } else {
        console.log("control gone");
      }
    });

    socket.on("update-content", (content: string) => {
      console.log("content update", content);
    });

    return () => {
      SocketService.getInstance().disconnect();
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " ") {
      console.log("space entered");
    }
    if (e.key === "Enter") {
      console.log("enter pressed");
    }
  };

  const handleInputChange = (val: string) => {
    setContent(val);
    console.log(val);
  };

  return (
    <>
      <div className="flex flex-col min-h-screen items-center justify-center">
        {loading ? (
          <LoadingSpinner size={50} />
        ) : (
          <div className="">
            <Input
              placeholder="content here"
              value={content}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleInputChange(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                handleKeyDown(e)
              }
            />
          </div>
        )}
      </div>
    </>
  );
};

export default RoomPage;
