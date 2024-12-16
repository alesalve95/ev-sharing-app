import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';

// Funzione di utilità per verificare il token
async function getUserIdFromToken(req) {
  const headersList = headers();
  const token = headersList.get('authorization')?.split(' ')[1];
  
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

// GET - Ottieni profilo utente
export async function GET(req) {
  try {
    await dbConnect();
    const userId = await getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore nel recupero del profilo' },
      { status: 500 }
    );
  }
}

// PUT - Aggiorna profilo utente
export async function PUT(req) {
  try {
    await dbConnect();
    const userId = await getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { password, ...updateData } = body;

    // Se viene fornita una nuova password, la hashiamo
    if (password) {
      const user = await User.findById(userId);
      user.password = password;
      await user.save();
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento del profilo' },
      { status: 500 }
    );
  }
}

// PATCH - Aggiorna minuti disponibili
export async function PATCH(req) {
  try {
    await dbConnect();
    const userId = await getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { minutes } = body;

    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { minutes: minutes } },
      { new: true }
    ).select('-password');

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento dei minuti' },
      { status: 500 }
    );
  }
}