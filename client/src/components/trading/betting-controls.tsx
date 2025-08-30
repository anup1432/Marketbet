
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700">
      <CardContent className="p-6">
        {/* Amount Selection */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-blue-400 text-2xl font-bold">₮</span>
            <span className="text-white font-bold text-lg" data-testid="selected-amount">
              {selectedAmount}
            </span>
            <div className="flex-1 flex gap-2">
              <Button 
                variant="secondary" 
              
