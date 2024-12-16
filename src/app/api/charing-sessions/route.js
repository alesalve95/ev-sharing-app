import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Station from '@/lib/models/Station';
import User from '@/lib/models/User';
import { verifyToken } from '@/lib/auth';

// POST - Inizia sessione di ricarica
export async function POST(req) {
  try {
    const userId = await verifyToken(req);
    if (!userId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    await dbConnect();
    const { stationId } = await req.json();

    // Verifica utente
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    if (user.minutes <= 0) {
      return NextResponse.json(
        { error: 'Minuti non sufficienti' },
        { status: 400 }
      );
    }

    // Verifica stazione
    const station = await Station.findById(stationId);
    if (!station) {
      return NextResponse.json(
        { error: 'Stazione non trovata' },
        { status: 404 }
      );
    }

    if (!station.available || !station.visible) {
      return NextResponse.json(
        { error: 'Stazione non disponibile' },
        { status: 400 }
      );
    }

    if (station.owner.toString() === userId) {
      return NextResponse.json(
        { error: 'Non puoi ricaricare sulla tua stazione' },
        { status: 400 }
      );
    }

    // Aggiorna stato stazione
    station.available = false;
    await station.save();

    return NextResponse.json({
      message: 'Sessione di ricarica iniziata',
      station: await station.populate('owner', 'fullName')
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore nell\'avvio della sessione di ricarica' },
      { status: 500 }
    );
  }
}

// PATCH - Termina sessione di ricarica
export async function PATCH(req) {
  try {
    const userId = await verifyToken(req);
    if (!userId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    await dbConnect();
    const { stationId, minutes } = await req.json();

    // Aggiorna minuti utente
    const user = await User.findById(userId);
    user.minutes -= minutes;
    if (user.minutes < 0) user.minutes = 0;
    await user.save();

    // Aggiorna stato stazione
    const station = await Station.findById(stationId);
    station.available = true;
    await station.save();

    return NextResponse.json({
      message: 'Sessione di ricarica terminata',
      remainingMinutes: user.minutes
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore nel terminare la sessione di ricarica' },
      { status: 500 }
    );
  }
}