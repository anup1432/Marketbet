
import { Card, CardContent } from "@/components/ui/card";

interface PlayerSectionProps {
  upBets: Array<{
    id: string;
    amount: string;
    botName?: string;
    isBot: boolean;
  }>;
  downBets: Array<{
    id: string;
    amount: string;
    botName?: string;
    isBot: boolean;
  }>;
}

function PlayerAvatar({ name, isBot }: { name: string; isBot: boolean }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  
  return (
    <div 
      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 ${
        isBot 
          ? 'bg-gray-700 border-gray-600 text-gray-300' 
          : 'bg-blue-600 border-blue-500 text-white'
      }`}
      title={name}
    >
      {initials.slice(0, 2)}
    </div>
  );
}

export default function PlayerSection({ upBets, downBets }: PlayerSectionProps) {
  const upTotal = upBets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0);
  const downTotal = downBets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0);

  return (
    <Card className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 border-gray-700">
      <CardContent className="p-6">
        <h3 className="text-lg font-bold text-white mb-4 text-center">Active Players</h3>
        
        <div className="flex justify-between items-start">
          {/* UP Players */}
          <div className="text-center flex-1">
            <div className="mb-3">
              <div className="text-green-400 text-xl font-bold" data-testid="up-total-amount">
                ${upTotal.toFixed(2)}
              </div>
              <div className="text-sm text-gray-400 font-medium" data-testid="up-players-count">
                {upBets.length} Players UP
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-2" data-testid="up-players">
              {upBets.slice(0, 8).map((bet) => (
                <PlayerAvatar 
                  key={bet.id} 
                  name={bet.botName || "You"} 
                  isBot={bet.isBot} 
                />
              ))}
              {upBets.length > 8 && (
                <div className="w-8 h-8 rounded-full bg-green-900/50 border-2 border-green-600 flex items-center justify-center text-xs text-green-400 font-bold">
                  +{upBets.length - 8}
                </div>
              )}
            </div>
          </div>
          
          {/* Divider */}
          <div className="mx-6 flex flex-col items-center">
            <div className="w-px h-16 bg-gradient-to-b from-gray-600 to-gray-800"></div>
            <div className="text-gray-500 text-xs font-semibold mt-2">VS</div>
          </div>
          
          {/* DOWN Players */}
          <div className="text-center flex-1">
            <div className="mb-3">
              <div className="text-red-400 text-xl font-bold" data-testid="down-total-amount">
                ${downTotal.toFixed(2)}
              </div>
              <div className="text-sm text-gray-400 font-medium" data-testid="down-players-count">
                {downBets.length} Players DOWN
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-2" data-testid="down-players">
              {downBets.slice(0, 8).map((bet) => (
                <PlayerAvatar 
                  key={bet.id} 
                  name={bet.botName || "You"} 
                  isBot={bet.isBot} 
                />
              ))}
              {downBets.length > 8 && (
                <div className="w-8 h-8 rounded-full bg-red-900/50 border-2 border-red-600 flex items-center justify-center text-xs text-red-400 font-bold">
                  +{downBets.length - 8}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pool Ratio */}
        <div className="mt-6 bg-gray-800/50 rounded-lg p-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total Pool:</span>
            <span className="text-white font-semibold">${(upTotal + downTotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-green-400">Win Multiplier: 1.95x</span>
            <span className="text-red-400">Win Multiplier: 1.95x</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
