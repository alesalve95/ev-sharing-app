'use client';

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { authService } from '@/lib/services/api';

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
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      if (isRegistration) {
        // Validazione
        const newErrors = {};
        if (!formData.firstName.trim()) newErrors.firstName = 'Nome richiesto';
        if (!formData.lastName.trim()) newErrors.lastName = 'Cognome richiesto';
        if (!formData.email.trim()) newErrors.email = 'Email richiesta';
        if (!formData.password) newErrors.password = 'Password richiesta';
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Le password non coincidono';
        }

        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          return;
        }

        // Generazione codice di verifica
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedCode(code);
        setRegistrationStep(2);
        
      } else {
        // Login
        const user = await authService.login({
          email: formData.email,
          password: formData.password
        });
        onLogin(user);
      }
    } catch (error) {
      setErrors({
        submit: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
  
    try {
      if (verificationCode === generatedCode) {
        // Log per debug
        console.log('Codice verificato, procedo con la registrazione');
        
        const user = await authService.register({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password
        });
  
        // Log per debug
        console.log('Registrazione completata:', user);
        
        // Assicuriamoci che onLogin venga chiamato con i dati corretti
        if (user && user.token) {
          onLogin(user);
        } else {
          throw new Error('Dati utente non validi dalla registrazione');
        }
      } else {
        setErrors({ verification: 'Codice non valido' });
      }
    } catch (error) {
      console.error('Errore durante la verifica:', error);
      setErrors({
        submit: error.message || 'Errore durante la registrazione'
      });
    } finally {
      setIsLoading(false);
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
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Verifica in corso...' : 'Verifica'}
          </Button>
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
                  disabled={isLoading}
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
                  disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>
            {errors.confirmPassword && (
              <Alert>
                <AlertDescription>{errors.confirmPassword}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {errors.submit && (
          <Alert>
            <AlertDescription>{errors.submit}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Elaborazione...' : (isRegistration ? 'Registrati' : 'Accedi')}
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
            disabled={isLoading}
          >
            {isRegistration ? 'Accedi' : 'Registrati'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Auth;
