import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Station from '@/lib/models/Station';
import { verifyToken } from '@/lib/auth';

export async function POST(req, { params }) {
  try {
    const userId = await verifyToken(req);
    if (!userId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    await dbConnect();
    const { id } = params;
    const { rating, comment } = await req.json();

    const station = await Station.findById(id);
    if (!station) {
      return NextResponse.json({ error: 'Stazione non trovata' }, { status: 404 });
    }

    // Verifica che l'utente non sia il proprietario
    if (station.owner.toString() === userId) {
      return NextResponse.json(
        { error: 'Non puoi recensire la tua stazione' },
        { status: 400 }
      );
    }

    // Aggiungi la recensione
    station.reviews.push({
      user: userId,
      rating,
      comment,
      createdAt: new Date()
    });

    // Aggiorna il rating medio
    const totalRating = station.reviews.reduce((acc, rev) => acc + rev.rating, 0);
    station.rating = totalRating / station.reviews.length;

    await station.save();
    await station.populate('reviews.user', 'fullName');

    return NextResponse.json(station);
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore nell\'aggiunta della recensione' },
      { status: 500 }
    );
  }
}