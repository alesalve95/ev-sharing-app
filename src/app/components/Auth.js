
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Auth = ({ onLogin }) => {
  const [isRegistration, setIsRegistration] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [errors, setErrors] = useState({});

  const loadUsers = () => {
    const savedUsers = localStorage.getItem('users');
    return savedUsers ? JSON.parse(savedUsers) : [];
  };

  const saveUsers = (users) => {
    localStorage.setItem('users', JSON.stringify(users));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    const users = loadUsers();

    if (isRegistration) {
      // Controllo se l'email è già registrata
      if (users.some(user => user.email === formData.email)) {
        newErrors.email = 'Email già registrata';
      }

      if (!formData.firstName.trim()) newErrors.firstName = 'Nome richiesto';
      if (!formData.lastName.trim()) newErrors.lastName = 'Cognome richiesto';
      if (!formData.email.trim()) newErrors.email = 'Email richiesta';
      if (!formData.password) newErrors.password = 'Password richiesta';
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Le password non coincidono';
      }

      if (Object.keys(newErrors).length === 0) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedCode(code);
        setRegistrationStep(2);
      }
    } else {
      // Login
      const user = users.find(u => u.email === formData.email);
      
      if (!user) {
        newErrors.email = 'Utente non trovato';
      } else if (user.password !== formData.password) {
        newErrors.password = 'Password non corretta';
      }

      if (Object.keys(newErrors).length === 0 && user) {
        onLogin(user);
        return;
      }
    }

    setErrors(newErrors);
  };

  const handleVerification = (e) => {
    e.preventDefault();
    if (verificationCode === generatedCode) {
      const newUser = {
        id: Date.now().toString(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        fullName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
        minutes: 60
      };

      const users = loadUsers();
      users.push(newUser);
      saveUsers(users);
      onLogin(newUser);
    } else {
      setErrors({ verification: 'Codice non valido' });
    }
  };
  if (registrationStep === 2 && isRegistration) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-xl font-bold">Verifica Email</h2>
        <p className="text-gray-600">
          Abbiamo inviato un codice di verifica a {formData.email}
          <br />
          <span className="text-sm text-gray-500">(Demo: {generatedCode})</span>
        </p>
        <form onSubmit={handleVerification} className="space-y-4">
          <Input
            type="text"
            placeholder="Inserisci il codice di verifica"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
          />
          {errors.verification && (
            <Alert>
              <AlertDescription>{errors.verification}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full">Verifica</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">
          {isRegistration ? 'Registrati' : 'Accedi'}
        </h2>
        <p className="text-gray-600 mt-2">
          {isRegistration 
            ? 'Crea un account per condividere o utilizzare le colonnine' 
            : 'Accedi al tuo account'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegistration && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  placeholder="Nome"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
                {errors.firstName && (
                  <Alert>
                    <AlertDescription>{errors.firstName}</AlertDescription>
                  </Alert>
                )}
              </div>
              <div>
                <Input
                  placeholder="Cognome"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
                {errors.lastName && (
                  <Alert>
                    <AlertDescription>{errors.lastName}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </>
        )}

        <div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="email"
              placeholder="Email"
              className="pl-10"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          {errors.email && (
            <Alert>
              <AlertDescription>{errors.email}</AlertDescription>
            </Alert>
          )}
        </div>

        <div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="pl-10"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && (
            <Alert>
              <AlertDescription>{errors.password}</AlertDescription>
            </Alert>
          )}
        </div>

        {isRegistration && (
          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Conferma Password"
                className="pl-10"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>
            {errors.confirmPassword && (
              <Alert>
                <AlertDescription>{errors.confirmPassword}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <Button type="submit" className="w-full">
          {isRegistration ? 'Registrati' : 'Accedi'}
        </Button>

        <div className="text-center text-sm text-gray-500">
          {isRegistration ? 'Hai già un account?' : 'Non hai un account?'}{' '}
          <button
            type="button"
            className="text-blue-500 hover:underline"
            onClick={() => {
              setIsRegistration(!isRegistration);
              setFormData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                confirmPassword: ''
              });
              setErrors({});
            }}
          >
            {isRegistration ? 'Accedi' : 'Registrati'}
          </button>
        </div>
      </form>
    </div>
  );
};
export default Auth;
