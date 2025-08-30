import { useState } from "react";

interface BettingControlsProps {
  onBet: (direction: "up" | "down", amount: number) => void;
}

export default function BettingControls({ onBet }: BettingControlsProps) {
  const [amount, setAmount] = useState<number>(10);

  const handleBet = (direction: "up" | "down") => {
    if (amount > 0) {
      onBet(direction, amount);
    }
  };

  return (
    <div className="p-4 bg-white/10 rounded-xl shadow-lg flex flex-col gap-4">
      {/* Input for bet amount */}
      <input
        type="number"
        min={1}
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="w-full p-2 rounded-lg border border-gray-300 text-black"
      />

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => handleBet("up")}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold"
        >
          Bet Up
        </button>

        <button
          onClick={() => handleBet("down")}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold"
        >
          Bet Down
        </button>
      </div>
    </div>
  );
}
