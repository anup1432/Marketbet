interface TimerProps {
  game: any;
}

export default function Timer({ game }: TimerProps) {
  const timeRemaining = game?.timeRemaining || 20;
  const phase = game?.phase || "betting";
  const circumference = 2 * Math.PI * 28; // radius = 28
  const strokeDashoffset = circumference - (timeRemaining / (phase === "betting" ? 20 : 5)) * circumference;

  return (
    <div className="relative">
      <svg className="w-16 h-16 transform -rotate-90">
        <circle 
          cx="32" 
          cy="32" 
          r="28" 
          fill="none" 
          stroke="hsl(var(--muted))" 
          strokeWidth="4"
        />
        <circle 
          cx="32" 
          cy="32" 
          r="28" 
          fill="none" 
          stroke="hsl(var(--primary))" 
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="timer-circle"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold" data-testid="timer-countdown">
          {timeRemaining}
        </span>
      </div>
    </div>
  );
}
