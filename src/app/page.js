'use client';

import AdminDashboard from './components/AdminDashboard';
import { Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Auth from './components/Auth';
import StationManagement from './components/StationManagement';
import ChargingSystem from './components/ChargingSystem';
import React, { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import { Clock, Plus, Battery, Star, Search, User, Mail, Lock, Eye, EyeOff, LogOut, MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';
import { authService, stationService, userService } from '@/lib/services/api';

const Map = dynamic(() => import('./components/MapComponent'), {
  ssr: false,
  loading: () => <p>Caricamento mappa...</p>
});

export default function EVSharingApp() {
  // Stati principali
  const [user, setUser] = useState(null);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [stations, setStations] = useState([]);
  const [chargingSession, setChargingSession] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Caricamento iniziale dei dati
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const userData = await userService.getProfile();
          setUser(userData);
        }
        const stationsData = await stationService.getAllStations();
        setStations(stationsData);
      } catch (error) {
        console.error('Error loading initial data:', error);
        addNotification('Errore nel caricamento dei dati');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Gestione notifiche
  const addNotification = (message) => {
    const newNotification = {
      id: Date.now(),
      message
    };
    setNotifications(prev => [...prev.slice(-2), newNotification]);
  };

  // Gestione autenticazione
  const handleLogin = async (userData) => {
    setUser(userData);
    addNotification(`Benvenuto ${userData.fullName}!`);
  };

  const handleLogout = () => {
    if (chargingSession) {
      handleStopCharging();
    }
    authService.logout();
    setUser(null);
    setChargingSession(null);
    setNotifications([]);
    addNotification("Logout effettuato con successo");
  };

  // Gestione colonnine
  const handleAddStation = async (newStationData) => {
    try {
      const station = await stationService.createStation({
        ...newStationData,
        available: true,
        visible: true,
      });
      
      setStations(prev => [...prev, station]);
      addNotification("Colonnina aggiunta con successo!");
    } catch (error) {
      console.error('Error adding station:', error);
      addNotification("Errore nell'aggiunta della colonnina");
    }
  };

  // Gestione ricarica
  const handleStartCharging = async (station) => {
    if (!user) {
      addNotification("Devi registrarti per utilizzare questa funzione!");
      return;
    }

    if (user.minutes <= 0) {
      addNotification("Non hai abbastanza minuti disponibili!");
      return;
    }

    if (station.owner === user.id) {
      addNotification("Non puoi ricaricare sulla tua colonnina!");
      return;
    }

    try {
      const updatedStation = await stationService.updateStation(station.id, { 
        available: false 
      });
      
      setStations(prev =>
        prev.map(s => s.id === station.id ? updatedStation : s)
      );

      setChargingSession({
        stationId: station.id,
        startTime: new Date(),
        owner: station.owner,
        location: station.location
      });

      addNotification("Ricarica iniziata!");
    } catch (error) {
      console.error('Error starting charging:', error);
      addNotification("Errore nell'avvio della ricarica");
    }
  };

  const handleStopCharging = async (minutes) => {
    try {
      // Aggiorna i minuti dell'utente
      const updatedUser = await userService.updateMinutes(-minutes);
      setUser(updatedUser);

      // Aggiorna lo stato della stazione
      const updatedStation = await stationService.updateStation(
        chargingSession.stationId,
        { available: true }
      );

      setStations(prev =>
        prev.map(s => s.id === chargingSession.stationId ? updatedStation : s)
      );

      setChargingSession(null);
      addNotification(`Ricarica completata! Hai utilizzato ${minutes} minuti`);
    } catch (error) {
      console.error('Error stopping charging:', error);
      addNotification("Errore nel completamento della ricarica");
    }
  };

  // Gestione recensioni
  const handleAddReview = async (stationId, review) => {
    try {
      const updatedStation = await stationService.updateStation(stationId, {
        reviews: [
          ...stations.find(s => s.id === stationId).reviews,
          { ...review, id: Date.now(), user: user.id, userName: user.fullName }
        ]
      });

      setStations(prev =>
        prev.map(station => station.id === stationId ? updatedStation : station)
      );

      addNotification("Recensione aggiunta con successo!");
    } catch (error) {
      console.error('Error adding review:', error);
      addNotification("Errore nell'aggiunta della recensione");
    }
  };

  const handleToggleStationStatus = async (stationId) => {
    try {
      const station = stations.find(s => s.id === stationId);
      const updatedStation = await stationService.updateStation(stationId, {
        visible: !station.visible
      });

      setStations(prev =>
        prev.map(s => s.id === stationId ? updatedStation : s)
      );

      addNotification("Stato della colonnina aggiornato!");
    } catch (error) {
      console.error('Error toggling station status:', error);
      addNotification("Errore nell'aggiornamento dello stato");
    }
  };

  const handleDeleteStation = async (stationId) => {
    try {
      await stationService.deleteStation(stationId);
      setStations(prev => prev.filter(station => station.id !== stationId));
      addNotification("Colonnina eliminata con successo!");
    } catch (error) {
      console.error('Error deleting station:', error);
      addNotification("Errore nell'eliminazione della colonnina");
    }
  };

  const filteredStations = stations
    .filter(station => {
      if (!user) return station.visible;
      if (station.owner === user.id) return true;
      return station.visible;
    })
    .filter(station =>
      station.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.owner.toLowerCase().includes(searchQuery.toLowerCase())
    );

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Caricamento...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>EV Sharing - Condivisione Colonnine di Ricarica</CardTitle>
            <div className="flex items-center gap-2">
              {user && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdminDashboard(true)}
                className="flex items-center gap-2"
              >
                <Shield size={16} />
                Admin
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {!user ? (
            <Auth onLogin={handleLogin} />
          ) : (
            <div className="space-y-6">
              <Card>
                <ChargingSystem
                  user={user}
                  chargingSession={chargingSession}
                  onStopCharging={handleStopCharging}
                  notifications={notifications}
                />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin size={20} />
                    Mappa delle colonnine
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Map stations={stations.filter(s => s.visible || s.owner === user?.id)} />
                </CardContent>
              </Card>

              <StationManagement
                user={user}
                stations={filteredStations}
                onAddStation={handleAddStation}
                onStartCharging={handleStartCharging}
                onAddReview={handleAddReview}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onToggleStationStatus={handleToggleStationStatus}
                onDeleteStation={handleDeleteStation}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {showAdminDashboard && (
        <div className="mt-4">
          <AdminDashboard onClose={() => setShowAdminDashboard(false)} />
        </div>
      )}
    </div>
  );
}

