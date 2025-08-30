import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface BettingControlsProps {
  onPlaceBet: (side: string, amount: number) => void;
  disabled: boolean;
  userBalance: number;
}

const BET_AMOUNTS = [1, 5, 10, 20, 50];

export default function BettingControls({ onPlaceBet, disabled, userBalance }: BettingControlsProps) {
  const [selectedAmount, setSelectedAmount] = useState(1);

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
  };

  const handlePlaceBet = (side: string) => {
    if (userBalance >= selectedAmount && !disabled) {
      onPlaceBet(side, selectedAmount);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-primary text-xl">₮</span>
          <span className="font-semibold" data-testid="selected-amount">
            {selectedAmount}
          </span>
          <div className="flex-1 flex gap-2">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setSelectedAmount(Math.max(1, selectedAmount / 2))}
              data-testid="button-half-amount"
            >
              1/2
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setSelectedAmount(selectedAmount * 2)}
              data-testid="button-double-amount"
            >
              2x
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-2 mb-4">
          {BET_AMOUNTS.map((amount) => (
            <Button
              key={amount}
              variant={selectedAmount === amount ? "default" : "secondary"}
              size="sm"
              onClick={() => handleAmountSelect(amount)}
              className="bet-amount-btn"
              data-testid={`button-bet-amount-${amount}`}
            >
              ${amount}
            </Button>
          ))}
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => handlePlaceBet("up")}
            disabled={disabled || userBalance < selectedAmount}
            className="py-4 bg-green-600 hover:bg-green-700 text-white pulse-green disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-bet-up"
          >
            <span className="mr-2">↗</span> Up
          </Button>
          <Button
            onClick={() => handlePlaceBet("down")}
            disabled={disabled || userBalance < selectedAmount}
            className="py-4 bg-red-600 hover:bg-red-700 text-white pulse-red disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-bet-down"
          >
            <span className="mr-2">↘</span> Down
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
