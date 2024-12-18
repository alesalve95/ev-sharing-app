import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

export const config = {
  runtime: 'edge',
  regions: ['iad1'], // deploy to IAD1 only
};

export async function POST(req) {
  try {
    console.log('Inizializzazione connessione DB');
    await dbConnect();
    
    const body = await req.json();
    console.log('Dati ricevuti', body);

    const user = await User.create({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      password: body.password,
      minutes: 60
    });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return new NextResponse(JSON.stringify({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      fullName: `${user.firstName} ${user.lastName}`,
      minutes: user.minutes,
      token
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Errore registrazione:', error);
    return new NextResponse(JSON.stringify({ 
      error: error.message || 'Errore durante la registrazione'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}