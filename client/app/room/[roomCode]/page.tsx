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
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getLeetCodeQuestion, QuestionData } from "@/service/LeetCodeService";
import SocketService from "@/service/SocketService";
import Editor from "@monaco-editor/react";
import { LogOut, RefreshCcwDot, Send, SendHorizontal } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

export const RoomPage = () => {
  const { roomCode } = useParams();
  type RoomData = {
    users: string[];
    content: string;
    currentController: string | null;
    questionData: QuestionData | null;
    currentLang: string;
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
  const [language, setLanguage] = useState("python");

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
            setShowQuestionDialog(true);
            setLoading(false);
          })
          .catch((e: unknown) => {
            if (e instanceof Error) {
              console.log(e.message);
              toast({
                title: "Failed to connect to server",
                description: e.message,
                variant: "destructive",
              });
            }
          });
      } else {
        SocketService.getInstance()
          .joinRoom((roomCode as string).toUpperCase())
          .then((result) => {
            if (result.success) {
              console.log("connected to ", roomCode);
              SocketService.getInstance().setConnectedRoom(roomCode as string);
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
        setQuestionData(room.questionData);
        setLanguage(room.currentLang);
      });

      socket.on("connect_error", (error: unknown) => {
        if (error instanceof Error) {
          console.error("Socket connection error:", error);
          if (error.message.includes("ERR_CONNECTION_REFUSED")) {
            console.error("Connection refused by the server");
          }
          setRoomError(true);
          setRoomErrorMsg(
            "Failed to connect to server. Please try again later."
          );
          setLoading(false);
        }
      });

      socket.on("control-update", (controllerId: string) => {
        setControl(controllerId);
      });

      socket.on("update-content", (content: string) => {
        console.log("receive");
        console.log(content);
        setContent(content);
      });

      socket.on("update-question", (questionData: QuestionData) => {
        setQuestionData(questionData);
      });

      socket.on("update-lang", (lang: string) => {
        console.log(lang);
        setLanguage(lang);
      });

      return () => {
        SocketService.getInstance().disconnect();
      };
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.log("hereee");
        console.log(e.message);
        toast({
          title: "Failed to connect to server",
          description: e.message,
          variant: "destructive",
        });
        setLoading(false);
      }
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isInControl) {
      if (
        e.key === " " ||
        e.key === "Enter" ||
        e.key === "Backspace" ||
        e.key === "Delete"
      ) {
        SocketService.getInstance().switchControl();
      }
    }
  };

  const handleInputChange = (val: string) => {
    if (isInControl) {
      SocketService.getInstance().contentUpdate(val);
      setContent(val);
    }
  };

  const handleFetchQuestion = async (e: FormEvent) => {
    e.preventDefault();
    setFetchingQuestion(true);
    try {
      const res = await getLeetCodeQuestion(questionUrl || "");
      setFetchingQuestion(false);
      if (res && res.success && res.question) {
        setQuestionData(res.question);
        SocketService.getInstance().questionUpdate(res.question);
        setShowQuestionDialog(false);
        console.log(res.question.codeSnippets);
        setLanguage("python");
        const codeSnippet = res.question.codeSnippets.find(
          (snippet) => snippet.langSlug === "python"
        );
        if (codeSnippet) {
          setContent(codeSnippet.code);
          SocketService.getInstance().langChange("python");
          SocketService.getInstance().contentUpdate(codeSnippet.code);
        }
      } else if (res && !res.success && res.error) {
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
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.log(e.message);
        toast({
          title: "Failed to fetch question",
          description: e.message,
          variant: "destructive",
        });
      }
    }
  };

  const handleChangeQuestion = async () => {
    setShowQuestionDialog(true);
  };

  const handleLangChange = (val: string) => {
    setLanguage(val);
    if (isInControl) {
      SocketService.getInstance().langChange(val);
      const codeSnippet = questionData?.codeSnippets.find(
        (snippet) => snippet.langSlug === val
      );
      if (codeSnippet) {
        setContent(codeSnippet.code);
        console.log("langchange", val);
        SocketService.getInstance().contentUpdate(codeSnippet.code);
      }
    }
  };

  return (
    <>
      <div className="flex flex-col max-h-screen h-full items-center justify-center">
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
                  Connected to Room:{" "}
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
              <div className="border col-span-7 grid grid-rows-[3_1fr]">
                <div className="flex align-middle justify-between">
                  {/* <div className="p-4">Select language:</div> */}
                  <div className="p-3">
                    <Select
                      value={language}
                      onValueChange={(val) => handleLangChange(val)}
                      disabled={!isInControl}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Language</SelectLabel>
                          <SelectItem value="python">Python</SelectItem>
                          <SelectItem value="python3">Python3</SelectItem>
                          <SelectItem value="cpp">C++</SelectItem>
                          <SelectItem value="java">Java</SelectItem>
                          <SelectItem value="javascript">JavaScript</SelectItem>
                          <SelectItem value="typescript">TypeScript</SelectItem>
                          <SelectItem value="ruby">Ruby</SelectItem>
                          <SelectItem value="golang">Go</SelectItem>
                          <SelectItem value="rust">Rust</SelectItem>
                          <SelectItem value="csharp">C#</SelectItem>
                          <SelectItem value="c">C</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <Link
                    href={`https://www.leetcode.com/problems/${questionData?.titleSlug}/description/`}
                    target="_blank"
                  >
                    <Button
                      variant={"outline"}
                      className="m-3 p-3"
                    >
                      <Send />
                      Submit
                    </Button>
                  </Link>
                </div>
                <div
                  onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    handleKeyDown(e);
                  }}
                >
                  <Editor
                    language={
                      language === "golang"
                        ? "go"
                        : language === "python3"
                        ? "python"
                        : language
                    }
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
          </div>
        )}
        <Dialog
          open={showQuestionDialog}
          onOpenChange={(open) => {
            if (!open && questionData) {
              setShowQuestionDialog(open);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Enter LeetCode question url</DialogTitle>
              <DialogDescription className="text-xs">
                (something like:
                https://leetcode.com/problems/two-sum/description/)
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e: FormEvent) => handleFetchQuestion(e)}>
              <div className="flex items-center space-x-2">
                <div className="grid flex-1 gap-2">
                  <Label htmlFor="link" className="sr-only">
                    Link
                  </Label>
                  <Input
                    id="link"
                    placeholder=""
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setQuestionUrl(e.target.value)
                    }
                  />
                </div>
                <Button
                  size="sm"
                  className="px-3"
                  type="submit"
                  disabled={fetchingQuestion}
                >
                  <span className="sr-only">Fetch</span>
                  {fetchingQuestion ? <LoadingSpinner /> : <SendHorizontal />}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default RoomPage;
