import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

const AboutPage = () => {
  return (
    <>
      <div className="flex flex-col justify-center items-center min-h-screen">
        <Card className="w-4/6">
          <CardHeader>
            <CardTitle> </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col p-4">
              <h4 className="text-5xl font-bold">What&apos;s this?</h4>
              <p className="text-lg mt-3">
                This website is a collaborative code editor that solve LeetCode
                problems with your friend in real-time. You can create a room
                and share the room code with your friend to start coding
                together. The person who creates the room gets to paste a link
                to a LeetCode problem which you can solve together.
              </p>
              <Separator className="mt-4" />
              <p className="text-4xl font-bold mt-6">But there&apos;s a twist!</p>
              <p className="text-lg mt-3">
                Only one person can control the code editor at a time. The
                control switches when the person in control presses a space, new
                line, backspace or delete.
              </p>
              <Separator className="mt-6" />
              <p className="text-2xl font-bold mt-6">Submitting the code:</p>
              <p className="text-lg mt-3">
                I know it just opens the page now.
                LeetCode does not provide a public API, nor do they allow us to programmatically log in to their 
                website to submit the code (they have strengthened their security against bots recently). 
                Therefore, you will have to <b>manually submit the code</b> to LeetCode (I knowwww).
                The best I could do was to copy the code that you typed into the clipboard.
                There is a workaround that requires you to get the session cookie from LeetCode after you login and
                use that to submit the code here. But I don&apos;t feel that it is ethical nor ideal to do so (Aaand <em>I am lazy</em> ofc).
                Maybe in the future I will implement it. Fingers crossed.
              </p>
              
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <div className="text-muted-foreground">
              {" "}
              inspired from{" "}
              <Link
                href="https://www.youtube.com/watch?v=ycTOEWqjeHI"
                className="underline"
                target="_blank"
              >
                {" "}
                yt/ThePrimeTime{" "}
              </Link>
            </div>
            <span className="text-muted-foreground mx-2"> | </span>
            <div className="text-muted-foreground">
              {" "}
              View the{" "}
              <Link
                href="https://github.com/amyyyth/2i1k"
                className="underline"
                target="_blank"
              >
                {" "}
                code{" "}
              </Link>
            </div>
          </CardFooter>
        </Card>
        <Link href="/">
          <Button className="mt-10 underline" variant={"ghost"}>
            OK, let&apos;s play <ExternalLink />{" "}
          </Button>
        </Link>
      </div>
    </>
  );
};

export default AboutPage;
