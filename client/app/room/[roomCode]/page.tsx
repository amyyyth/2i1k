"use client";
// I KNOW THIS PAGE IS TOO CLUTTERED!
// PARDON ME CODE LORDS, THIS WHOLE THING WAS DONE IN UNDER 24HRS WHILE I WAS SLEEP DEPRIVED
import { SanitizeHTML } from "@/components/SanitizeHTML";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { getLeetCodeQuestion, QuestionData } from "@/service/LeetCodeService";
import SocketService from "@/service/SocketService";
import Editor from "@monaco-editor/react";
import { LogOut, RefreshCcwDot, SendHorizontal } from "lucide-react";
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
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [questionUrl, setQuestionUrl] = useState<string | null>(null);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [fetchingQuestion, setFetchingQuestion] = useState(false);

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
    if(!questionData){
      setShowQuestionDialog(true)
    }
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
        setControl(room.currentController as string);
        setContent(room.content as string);
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
    if (
      e.key === " " ||
      e.key === "Enter" ||
      e.key === "Backspace" ||
      e.key === "Delete"
    ) {
      SocketService.getInstance().switchControl();
    }
  };

  const handleInputChange = (val: string) => {
    setContent(val);
    SocketService.getInstance().contentUpdate(val);
  };

  const handleFetchQuestion = async () => {
    setFetchingQuestion(true);
    const res = await getLeetCodeQuestion(
      questionUrl || ""
    );
    setFetchingQuestion(false);
    if (res && res.success && res.question) {
      setQuestionData(res.question);
      setShowQuestionDialog(false)
    } else if (res && !res.success && res.error) {
      console.log("err");
      toast({
        title: "Failed to fetch question",
        description: res.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Failed to fetch question",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleChangeQuestion = async () => {
    setShowQuestionDialog(true);
  };

  return (
    <>
      <div className="flex flex-col min-h-screen h-screen items-center justify-center">
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
          <div className="w-screen h-full">
            <div className="h-16 border-b flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-4 mr-4 text-2xl font-bold">
                  {questionData?.title || "Question title here"}
                </div>
                <Button
                  variant={"outline"}
                  className="mr-4"
                  onClick={handleChangeQuestion}
                >
                  <RefreshCcwDot />
                  Change
                </Button>
              </div>
              <div className="flex">
                <div className="p-2 mr-4">
                  Connected to{" "}
                  <span className="font-bold">
                    {" "}
                    {SocketService.getInstance().getConnectedRoom()}
                  </span>
                </div>
                <Link href={"/"}>
                  <Button variant={"outline"} className="mr-4">
                    <LogOut />
                    Leave
                  </Button>
                </Link>
              </div>
            </div>
            <div className="h-full grid gap-2 grid-cols-12">
              <div className="border col-span-5 p-4">
                <SanitizeHTML html={questionData?.content || ""} />
              </div>
              <div
                className="border col-span-7"
                onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  handleKeyDown(e);
                }}
              >
                <Editor
                  height="100%"
                  language="javascript"
                  theme="vs-dark"
                  value={content}
                  options={{
                    inlineSuggest: { enabled: true },
                    fontSize: 16,
                    formatOnType: true,
                    autoClosingBrackets: "always",
                    readOnly: !isInControl,
                    autoClosingQuotes: "always",
                  }}
                  onChange={(e) => handleInputChange(e as string)}
                  className={isInControl ? "" : "opacity-30"}
                />
              </div>
            </div>
          </div>
        )}
        <Dialog
          open={showQuestionDialog}
          onOpenChange={(open) => setShowQuestionDialog(open)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Enter LeetCode question url</DialogTitle>
              <DialogDescription className="text-xs">
                (something like: https://leetcode.com/problems/two-sum/description/)
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="link" className="sr-only">
                  Link
                </Label>
                <Input
                  id="link"
                  placeholder=""
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setQuestionUrl(e.target.value)}
                />
              </div>
              <Button size="sm" className="px-3" onClick={handleFetchQuestion} disabled={fetchingQuestion}>
                <span className="sr-only">Fetch</span>
                {
                  fetchingQuestion ?
                  <LoadingSpinner />
                  :
                  <SendHorizontal />
                }
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default RoomPage;
