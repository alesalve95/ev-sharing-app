import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    console.log('Ricevuta richiesta di registrazione');
    await dbConnect();
    
    const body = await req.json();
    console.log('Dati ricevuti:', body);
    const { firstName, lastName, email, password } = body;

    // Verifica se l'utente esiste già
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Email già registrata:', email);
      return NextResponse.json(
        { error: 'Email già registrata' },
        { status: 400 }
      );
    }

    // Crea nuovo utente
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      minutes: 60
    });

    console.log('Utente creato:', user._id);

    // Crea il token JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    const response = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      fullName: `${user.firstName} ${user.lastName}`,
      minutes: user.minutes,
      token
    };

    console.log('Invio risposta registrazione');
    return NextResponse.json(response);
  } catch (error) {
    console.error('Errore in register:', error);
    return NextResponse.json(
      { error: 'Errore durante la registrazione' },
      { status: 500 }
    );
  }
}