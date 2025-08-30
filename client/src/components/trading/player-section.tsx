import { Card, CardContent } from "@/components/ui/card";

interface PlayerSectionProps {
  upBets: Array<{
    id: string;
    amount: string;
    botName?: string;
    isBot?: boolean;
  }>;
  downBets: Array<{
    id: string;
    amount: string;
    botName?: string;
    isBot?: boolean;
  }>;
}

export default function PlayerSection({ upBets, downBets }: PlayerSectionProps) {
  const upTotal = upBets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0);
  const downTotal = downBets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0);

  const PlayerAvatar = ({ name, isBot }: { name: string; isBot?: boolean }) => (
    <div 
      className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-medium"
      title={name}
    >
      {isBot ? name.charAt(0) : "Y"}
    </div>
  );

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="text-center flex-1">
            <div className="text-sm text-muted-foreground mb-2" data-testid="up-players-count">
              {upBets.length} Players
            </div>
            <div className="text-green-500 font-semibold" data-testid="up-total-amount">
              ${upTotal.toFixed(2)}
            </div>
            <div className="flex flex-wrap justify-center gap-1 mt-2" data-testid="up-players">
              {upBets.slice(0, 10).map((bet) => (
                <PlayerAvatar 
                  key={bet.id} 
                  name={bet.botName || "You"} 
                  isBot={bet.isBot} 
                />
              ))}
              {upBets.length > 10 && (
                <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs">
                  +{upBets.length - 10}
                </div>
              )}
            </div>
          </div>
          
          <div className="w-px h-12 bg-border mx-4"></div>
          
          <div className="text-center flex-1">
            <div className="text-sm text-muted-foreground mb-2" data-testid="down-players-count">
              {downBets.length} Players
            </div>
            <div className="text-red-500 font-semibold" data-testid="down-total-amount">
              ${downTotal.toFixed(2)}
            </div>
            <div className="flex flex-wrap justify-center gap-1 mt-2" data-testid="down-players">
              {downBets.slice(0, 10).map((bet) => (
                <PlayerAvatar 
                  key={bet.id} 
                  name={bet.botName || "You"} 
                  isBot={bet.isBot} 
                />
              ))}
              {downBets.length > 10 && (
                <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs">
                  +{downBets.length - 10}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
