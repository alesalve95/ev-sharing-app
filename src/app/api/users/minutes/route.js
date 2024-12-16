import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { verifyToken } from '@/lib/auth';

export async function PATCH(req) {
  try {
    const userId = await verifyToken(req);
    if (!userId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    await dbConnect();
    const { minutes } = await req.json();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    // Aggiorna i minuti (può essere positivo o negativo)
    user.minutes += minutes;
    
    // Impedisci minuti negativi
    if (user.minutes < 0) {
      user.minutes = 0;
    }

    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;

    return NextResponse.json(userResponse);
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento dei minuti' },
      { status: 500 }
    );
  }
}