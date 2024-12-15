'use client';
import AdminDashboard from './components/AdminDashboard';
import { Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
// import { LogOut } from 'lucide-react';
import Auth from './components/Auth';
import StationManagement from './components/StationManagement';
import ChargingSystem from './components/ChargingSystem';
import React, { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import { Clock, Plus, Battery, Star, Search, User, Mail, Lock, Eye, EyeOff, LogOut, MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('./components/MapComponent'), { 
  ssr: false,
  loading: () => <p>Caricamento mappa...</p>
});

// Funzione per caricare gli utenti dal localStorage
const loadUsers = () => {
  if (typeof window !== 'undefined') {
    const savedUsers = localStorage.getItem('users');
    return savedUsers ? JSON.parse(savedUsers) : [];
  }
  return [];
};

// Funzione per salvare gli utenti nel localStorage
const saveUsers = (users) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('users', JSON.stringify(users));
  }
};

export default function EVSharingApp() {
  // Stati principali
  const [user, setUser] = useState(null);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [stations, setStations] = useState([
    { 
      id: 1, 
      owner: "Marco Rossi",
      location: "Via Roma 1, Milano",
      available: true,
      visible: true,
      rating: 4.5,
      ownerId: "1",
      reviews: [
        { id: 1, user: "Luigi", rating: 5, comment: "Ottima posizione" },
        { id: 2, user: "Anna", rating: 4, comment: "Molto comoda" }
      ]
    },
    { 
      id: 2,
      owner: "Laura Bianchi",
      location: "Via Garibaldi 45, Milano",
      available: true,
      visible: true,
      rating: 4.8,
      ownerId: "2",
      reviews: [
        { id: 3, user: "Mario", rating: 5, comment: "Perfetta" }
      ]
    }
  ]);
  const [chargingSession, setChargingSession] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  useEffect(() => {
    const savedStations = localStorage.getItem('stations');
    if (savedStations) {
      setStations(JSON.parse(savedStations));
    }
  }, []);
  useEffect(() => {
    // Carica l'utente salvato al mount del componente
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
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
  const handleLogin = (userData) => {
    setUser(userData);
    // Salva l'utente corrente nel localStorage
    localStorage.setItem('currentUser', JSON.stringify(userData));
    addNotification(`Benvenuto ${userData.fullName}!`);
  };
  
  const handleLogout = () => {
    if (chargingSession) {
      stopCharging(Math.floor(timer / 60));
    }
    setUser(null);
    // Rimuovi l'utente dal localStorage al logout
    localStorage.removeItem('currentUser');
    setChargingSession(null);
    setNotifications([]);
    addNotification("Logout effettuato con successo");
  };

  // Gestione colonnine
  const handleAddStation = (newStation) => {
    const station = {
      id: Date.now(),
      owner: user.fullName,
      ownerId: user.id,
      address: newStation.address,
      city: newStation.city,
      cap: newStation.cap,
      location: `${newStation.address}, ${newStation.city} ${newStation.cap}`.trim(),
      available: true,
      visible: true,
      rating: 0,
      reviews: [],
      latitude: newStation.latitude,
      longitude: newStation.longitude,
      power: newStation.power,
      connectorType: newStation.connectorType,
      currentType: newStation.currentType,          // Aggiunta la virgola qui
      additionalInfo: newStation.additionalInfo     // Ora è corretto
    };



    const updatedStations = [...stations, station];
    setStations(updatedStations);
    localStorage.setItem('stations', JSON.stringify(updatedStations));
    addNotification("Colonnina aggiunta con successo!");
  };

  // Gestione ricarica
  const startCharging = (station) => {
    if (!user) {
      addNotification("Devi registrarti per utilizzare questa funzione!");
      return;
    }

    if (user.minutes <= 0) {
      addNotification("Non hai abbastanza minuti disponibili!");
      return;
    }

    if (station.ownerId === user.id) {
      addNotification("Non puoi ricaricare sulla tua colonnina!");
      return;
    }
    
    setStations(prev => 
      prev.map(s => s.id === station.id ? { ...s, available: false } : s)
    );
    
    setChargingSession({
      stationId: station.id,
      startTime: new Date(),
      owner: station.owner,
      location: station.location
    });

    addNotification("Ricarica iniziata!");
  };

  const stopCharging = (minutes) => {
    setUser(prev => ({
      ...prev,
      minutes: prev.minutes - minutes
    }));
    
    setStations(prev => 
      prev.map(s => 
        s.id === chargingSession.stationId ? { ...s, available: true } : s
      )
    );
    
    setChargingSession(null);
    addNotification(`Ricarica completata! Hai utilizzato ${minutes} minuti`);
  };

  // Gestione recensioni
  const handleAddReview = (stationId, review) => {
    const updatedStations = stations.map(station => {
      if (station.id === stationId) {
        const newReviews = [...station.reviews, { ...review, id: Date.now(), user: user.fullName }];
        const avgRating = newReviews.reduce((acc, curr) => acc + curr.rating, 0) / newReviews.length;
        
        return {
          ...station,
          reviews: newReviews,
          rating: Number(avgRating.toFixed(1))
        };
      }
      return station;
    });
    setStations(updatedStations);
    localStorage.setItem('stations', JSON.stringify(updatedStations));
    addNotification("Recensione aggiunta con successo!");
  };
  const handleToggleStationStatus = (stationId) => {
    const updatedStations = stations.map(station => {
      if (station.id === stationId) {
        return { ...station, visible: !station.visible };
      }
      return station;
    });
    setStations(updatedStations);
    localStorage.setItem('stations', JSON.stringify(updatedStations));
    addNotification("Stato della colonnina aggiornato!");
  };
  
  const handleDeleteStation = (stationId) => {
    const updatedStations = stations.filter(station => station.id !== stationId);
    setStations(updatedStations);
    localStorage.setItem('stations', JSON.stringify(updatedStations));
    addNotification("Colonnina eliminata con successo!");
  };
  const filteredStations = stations
  .filter(station => {
    // Se non c'è un utente loggato, mostra solo le colonnine visibili
    if (!user) return station.visible;
    // Mostra sempre le colonnine dell'utente corrente
    if (station.ownerId === user.id) return true;
    // Per le altre colonnine, mostra solo quelle visibili
    return station.visible;
  })
  .filter(station => 
    station.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    station.owner.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                onStopCharging={stopCharging}
                notifications={notifications}
              />
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <MapPin size={20} />
      Mappa delle colonnine
    </CardTitle>
  </CardHeader>
  <CardContent>
    <Map stations={stations.filter(s => s.visible || s.ownerId === user?.id)} />
  </CardContent>
</Card>
              
              <StationManagement
                user={user}
                stations={filteredStations}
                onAddStation={handleAddStation}
                onStartCharging={startCharging}
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

