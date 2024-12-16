'use client';

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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let interval;
    if (chargingSession) {
      interval = setInterval(() => {
        setTimer(prev => {
          // Se l'utente ha finito i minuti, ferma automaticamente la ricarica
          if (prev + 1 >= user.minutes * 60) {
            onStopCharging(user.minutes);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [chargingSession, user.minutes, onStopCharging]);

  const handleStopCharging = async () => {
    try {
      setIsLoading(true);
      const minutes = Math.floor(timer / 60);
      await onStopCharging(minutes);
    } catch (error) {
      console.error('Error stopping charging:', error);
    } finally {
      setIsLoading(false);
      setTimer(0);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

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
                  <p className="text-sm text-gray-600">
                    {user.minutes} minuti disponibili
                  </p>
                </div>
                {chargingSession && (
                  <div className="mt-2 text-sm text-blue-600">
                    <p>Ricarica in corso presso: {chargingSession.owner}</p>
                    <p>Tempo: {formatTime(timer)}</p>
                    <p className="text-xs text-gray-500">
                      {user.minutes > 0 
                        ? `Minuti rimanenti: ${user.minutes - Math.floor(timer / 60)}`
                        : 'Minuti esauriti'}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {chargingSession && (
              <Button
                variant="destructive"
                onClick={handleStopCharging}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                {isLoading ? 'Arresto in corso...' : 'Stop ricarica'}
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

