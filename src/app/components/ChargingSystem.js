import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, User } from 'lucide-react';

const ChargingSystem = ({ 
  user = { fullName: '', minutes: 0 },
  chargingSession = null,
  onStopCharging = () => {},
  notifications = []
}) => {
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (chargingSession) {
      interval = setInterval(() => setTimer(prev => prev + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [chargingSession]);

  return (
    <div className="space-y-4">
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <User className="w-8 h-8" />
              <div>
                <h3 className="font-semibold">{user.fullName}</h3>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-600">{user.minutes} minuti disponibili</p>
                </div>
                {chargingSession && (
                  <div className="mt-2 text-sm text-blue-600">
                    <p>Ricarica in corso presso: {chargingSession.owner}</p>
                    <p>Tempo: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</p>
                  </div>
                )}
              </div>
            </div>
            {chargingSession && (
              <Button 
                variant="destructive"
                onClick={() => onStopCharging(Math.floor(timer / 60))}
                className="flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Stop ricarica
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map(notification => (
            <Alert key={notification.id}>
              <AlertDescription>{notification.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChargingSystem;

