'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Shield, User, BatteryCharging, X, Search, Clock, Eye, EyeOff, Mail, Lock } from 'lucide-react';

const AdminDashboard = ({ onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [editingMinutes, setEditingMinutes] = useState(null);
  const [tempMinutes, setTempMinutes] = useState('');
  const [editingEmail, setEditingEmail] = useState(null);
  const [tempEmail, setTempEmail] = useState('');
  const [editingPassword, setEditingPassword] = useState(null);
  const [tempPassword, setTempPassword] = useState('');
  const [showPassword, setShowPassword] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Chiamate API per ottenere utenti e stazioni
      const response = await fetch('/api/admin/data', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) throw new Error('Errore nel caricamento dei dati');

      const data = await response.json();
      setUsers(data.users);
      setStations(data.stations);
    } catch (error) {
      setError('Errore nel caricamento dei dati. Riprova più tardi.');
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: loginData.username,
          password: loginData.password
        })
      });

      if (!response.ok) throw new Error('Credenziali non valide');

      const data = await response.json();
      localStorage.setItem('adminToken', data.token);
      setIsAuthenticated(true);
    } catch (error) {
      setError('Credenziali non valide');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo utente? Verranno eliminate anche tutte le sue colonnine.')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) throw new Error('Errore nell\'eliminazione dell\'utente');

      setUsers(users.filter(user => user.id !== userId));
      setStations(stations.filter(station => station.ownerId !== userId));
    } catch (error) {
      setError('Errore nell\'eliminazione dell\'utente');
      console.error('Delete user error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMinutes = async (userId) => {
    const minutes = parseInt(tempMinutes);
    if (isNaN(minutes) || minutes < 0) {
      setError('Inserisci un numero valido di minuti');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/users/${userId}/minutes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ minutes })
      });

      if (!response.ok) throw new Error('Errore nell\'aggiornamento dei minuti');

      const updatedUser = await response.json();
      setUsers(users.map(user => user.id === userId ? updatedUser : user));
      setEditingMinutes(null);
      setTempMinutes('');
    } catch (error) {
      setError('Errore nell\'aggiornamento dei minuti');
      console.error('Update minutes error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEmail = async (userId) => {
    if (!tempEmail.trim() || !tempEmail.includes('@')) {
      setError('Inserisci un indirizzo email valido');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/users/${userId}/email`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ email: tempEmail })
      });

      if (!response.ok) throw new Error('Errore nell\'aggiornamento dell\'email');

      const updatedUser = await response.json();
      setUsers(users.map(user => user.id === userId ? updatedUser : user));
      setEditingEmail(null);
      setTempEmail('');
    } catch (error) {
      setError('Errore nell\'aggiornamento dell\'email');
      console.error('Update email error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (userId) => {
    if (!tempPassword.trim() || tempPassword.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/users/${userId}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ password: tempPassword })
      });

      if (!response.ok) throw new Error('Errore nell\'aggiornamento della password');

      setEditingPassword(null);
      setTempPassword('');
    } catch (error) {
      setError('Errore nell\'aggiornamento della password');
      console.error('Update password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (userId) => {
    setShowPassword(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Admin Login
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Input
              type="text"
              placeholder="Username"
              value={loginData.username}
              onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
              disabled={isLoading}
            />
            <Input
              type="password"
              placeholder="Password"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              disabled={isLoading}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Accesso in corso...' : 'Accedi'}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Dashboard Amministratore
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Cerca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Tabs defaultValue="users" onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="users" className="flex-1">
                <User className="w-4 h-4 mr-2" />
                Utenti ({users.length})
              </TabsTrigger>
              <TabsTrigger value="stations" className="flex-1">
                <BatteryCharging className="w-4 h-4 mr-2" />
                Colonnine ({stations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Nome</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Password</th>
                      <th className="text-left p-2">Minuti Disponibili</th>
                      <th className="text-center p-2">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(user =>
                      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      user.email.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map(user => (
                      <tr key={user.id} className="border-b">
                        <td className="p-2">{user.fullName}</td>
                        
                        {/* Email */}
                        <td className="p-2">
                          {editingEmail === user.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="email"
                                value={tempEmail}
                                onChange={(e) => setTempEmail(e.target.value)}
                                className="w-48"
                                disabled={isLoading}
                              />
                              <Button
                                size="sm"
                                onClick={() => handleUpdateEmail(user.id)}
                                disabled={isLoading}
                              >
                                Salva
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingEmail(null);
                                  setTempEmail('');
                                }}
                                disabled={isLoading}
                              >
                                Annulla
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>{user.email}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingEmail(user.id);
                                  setTempEmail(user.email);
                                }}
                                disabled={isLoading}
                              >
                                <Mail className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                        
                        {/* Password */}
                        <td className="p-2">
                          {editingPassword === user.id ? (
                            <div className="flex items-center gap-2">
                              <div className="relative w-48">
                                <Input
                                  type={showPassword[user.id] ? "text" : "password"}
                                  value={tempPassword}
                                  onChange={(e) => setTempPassword(e.target.value)}
                                  disabled={isLoading}
                                />
                                <button
                                  type="button"
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                                  onClick={() => togglePasswordVisibility(user.id)}
                                  disabled={isLoading}
                                >
                                  {showPassword[user.id] ? (
                                    <EyeOff className="w-4 h-4 text-gray-500" />
                                  ) : (
                                    <Eye className="w-4 h-4 text-gray-500" />
                                  )}
                                </button>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleUpdatePassword(user.id)}
                                disabled={isLoading}
                              >
                                Salva
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingPassword(null);
                                  setTempPassword('');
                                }}
                                disabled={isLoading}
                              >
                                Annulla
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>{showPassword[user.id] ? user.password : '••••••'}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => togglePasswordVisibility(user.id)}
                                disabled={isLoading}
                              >
                                {showPassword[user.id] ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingPassword(user.id);
                                  setTempPassword(user.password);
                                }}
                                disabled={isLoading}
                              >
                                <Lock className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </td>

                        {/* Minuti */}
                        <td className="p-2">
                          {editingMinutes === user.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={tempMinutes}
                                onChange={(e) => setTempMinutes(e.target.value)}
                                className="w-24"
                                min="0"
                                disabled={isLoading}
                              />
                              <Button
                                size="sm"
                                onClick={() => handleUpdateMinutes(user.id)}
                                disabled={isLoading}
                              >
                                Salva
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingMinutes(null);
                                  setTempMinutes('');
                                }}
                                disabled={isLoading}
                              >
                                Annulla
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>{user.minutes}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingMinutes(user.id);
                                  setTempMinutes(user.minutes.toString());
                                }}
                                disabled={isLoading}
                              >
                                <Clock className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </td>

                        <td className="p-2 text-center">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={isLoading}
                          >
                            Elimina
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="stations" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Proprietario</th>
                      <th className="text-left p-2">Posizione</th>
                      <th className="text-left p-2">Stato</th>
                      <th className="text-left p-2">Info Tecniche</th>
                      <th className="text-left p-2">Info Aggiuntive</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stations.filter(station =>
                      station.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      station.location.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map(station => (
                      <tr key={station.id} className="border-b">
                        <td className="p-2">{station.owner}</td>
                        <td className="p-2">{station.location}</td>
                        <td className="p-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                            station.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {station.available ? 'Disponibile' : 'In uso'}
                          </span>
                        </td>
                        <td className="p-2">
                          <div className="text-sm">
                            <p>Potenza: {station.power} kW</p>
                            <p>Connettore: {station.connectorType}</p>
                            <p>Corrente: {station.currentType}</p>
                          </div>
                        </td>
                        <td className="p-2">
                          {station.additionalInfo || 'Nessuna informazione aggiuntiva'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDashboard;
