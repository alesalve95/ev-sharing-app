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

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = () => {
    const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const savedStations = JSON.parse(localStorage.getItem('stations') || '[]');
    setUsers(savedUsers);
    setStations(savedStations);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginData.username === 'admin' && loginData.password === 'admin123') {
      setIsAuthenticated(true);
    }
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo utente? Verranno eliminate anche tutte le sue colonnine.')) {
      const updatedUsers = users.filter(user => user.id !== userId);
      setUsers(updatedUsers);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      
      const updatedStations = stations.filter(station => station.ownerId !== userId);
      setStations(updatedStations);
      localStorage.setItem('stations', JSON.stringify(updatedStations));
    }
  };

  const handleUpdateMinutes = (userId) => {
    const minutes = parseInt(tempMinutes);
    if (isNaN(minutes) || minutes < 0) {
      alert('Inserisci un numero valido di minuti');
      return;
    }

    updateUserField(userId, 'minutes', minutes);
    setEditingMinutes(null);
    setTempMinutes('');
  };

  const handleUpdateEmail = (userId) => {
    if (!tempEmail.trim() || !tempEmail.includes('@')) {
      alert('Inserisci un indirizzo email valido');
      return;
    }

    updateUserField(userId, 'email', tempEmail);
    setEditingEmail(null);
    setTempEmail('');
  };

  const handleUpdatePassword = (userId) => {
    if (!tempPassword.trim() || tempPassword.length < 6) {
      alert('La password deve essere di almeno 6 caratteri');
      return;
    }

    updateUserField(userId, 'password', tempPassword);
    setEditingPassword(null);
    setTempPassword('');
  };

  const updateUserField = (userId, field, value) => {
    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        const updatedUser = { ...user, [field]: value };
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (currentUser.id === userId) {
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
        return updatedUser;
      }
      return user;
    });

    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
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
            <Input
              type="text"
              placeholder="Username"
              value={loginData.username}
              onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
            />
            <Input
              type="password"
              placeholder="Password"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            />
            <Button type="submit" className="w-full">Accedi</Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Cerca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                    {filteredUsers.map(user => (
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
                              />
                              <Button
                                size="sm"
                                onClick={() => handleUpdateEmail(user.id)}
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
                                />
                                <button
                                  type="button"
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                                  onClick={() => togglePasswordVisibility(user.id)}
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
                              />
                              <Button
                                size="sm"
                                onClick={() => handleUpdateMinutes(user.id)}
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
              {/* Il contenuto esistente per le stazioni rimane invariato */}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDashboard;
