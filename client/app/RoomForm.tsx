"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";

export const RoomForm = () => {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [inputError, setInputError] = useState(false);


  const router = useRouter();

  const handleJoinRoom = async (e: FormEvent) => {
    e.preventDefault();
    if (roomCode?.length !== 6) {
      setInputError(true);
      return;
    }
    router.push(`/room/${roomCode}`);
  };

  const handleCreateRoom = async () => {
    router.push("room/new");
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
            <Link href="/about">
            <Button className="mt-10 underline" variant={"ghost"}>what&apos;s all this about? <ExternalLink /> </Button>
            </Link>
      </div>
    </>
  );
};
