import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST - Registrazione
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { firstName, lastName, email, password } = body;

    // Verifica se l'utente esiste già
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email già registrata' },
        { status: 400 }
      );
    }

    // Crea il nuovo utente
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      minutes: 60 // Minuti iniziali gratuiti
    });

    // Genera il token
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Rimuovi la password dalla risposta
    const userResponse = user.toObject();
    delete userResponse.password;

    return NextResponse.json({
      ...userResponse,
      token
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore durante la registrazione' },
      { status: 500 }
    );
  }
}

// PUT - Login
export async function PUT(req) {
  try {
    await dbConnect();
    const { email, password } = await req.json();

    // Trova l'utente
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      );
    }

    // Verifica la password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Password non corretta' },
        { status: 400 }
      );
    }

    // Genera il token
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Rimuovi la password dalla risposta
    const userResponse = user.toObject();
    delete userResponse.password;

    return NextResponse.json({
      ...userResponse,
      token
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore durante il login' },
      { status: 500 }
    );
  }
}