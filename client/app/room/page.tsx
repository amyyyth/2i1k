"use client"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const RoomPage = () => {
  const router = useRouter();
  useEffect(() => {
    router.push("/room/new");
  });
  return (
    <>
      <div className="flex flex-col min-h-screen items-center justify-center">
        <LoadingSpinner size={50} />
      </div>
    </>
  );
};

export default RoomPage;
