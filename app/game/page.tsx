import { getValidAccessToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import GameClient from "./GameClient";

export default async function GamePage() {
  const token = await getValidAccessToken();
  if (!token) {
    redirect("/");
  }
  return <GameClient />;
}
