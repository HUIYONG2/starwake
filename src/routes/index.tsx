import { createFileRoute } from "@tanstack/react-router";
import { StarwakeGame } from "@/components/game/StarwakeGame";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <StarwakeGame />;
}
