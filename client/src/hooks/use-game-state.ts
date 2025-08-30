import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export function useGameState() {
  const [gamePhase, setGamePhase] = useState<"betting" | "result">("betting");
  const [timeRemaining, setTimeRemaining] = useState(20);

  const { data: game } = useQuery({
    queryKey: ["/api/game/current"],
    refetchInterval: 1000,
  });

  useEffect(() => {
    if (game) {
      setGamePhase(game.phase);
      setTimeRemaining(game.timeRemaining);
    }
  }, [game]);

  return {
    gamePhase,
    timeRemaining,
    game,
  };
}
