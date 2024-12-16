import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Station from '@/lib/models/Station';
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

// GET - Ottieni tutte le stazioni
export async function GET() {
  try {
    await dbConnect();
    const stations = await Station.find({ visible: true })
                                .populate('owner', 'firstName lastName')
                                .populate('reviews.user', 'firstName lastName');
    return NextResponse.json(stations);
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore nel recupero delle stazioni' },
      { status: 500 }
    );
  }
}

// POST - Crea una nuova stazione
export async function POST(req) {
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
    const station = await Station.create({
      ...body,
      owner: userId
    });

    return NextResponse.json(station);
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore nella creazione della stazione' },
      { status: 500 }
    );
  }
}

// PUT - Aggiorna una stazione
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
    const { id, ...updateData } = body;

    const station = await Station.findOneAndUpdate(
      { _id: id, owner: userId },
      updateData,
      { new: true }
    );

    if (!station) {
      return NextResponse.json(
        { error: 'Stazione non trovata o non autorizzato' },
        { status: 404 }
      );
    }

    return NextResponse.json(station);
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento della stazione' },
      { status: 500 }
    );
  }
}

// DELETE - Elimina una stazione
export async function DELETE(req) {
  try {
    await dbConnect();
    const userId = await getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    const station = await Station.findOneAndDelete({ _id: id, owner: userId });

    if (!station) {
      return NextResponse.json(
        { error: 'Stazione non trovata o non autorizzato' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Stazione eliminata con successo' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore nella eliminazione della stazione' },
      { status: 500 }
    );
  }
}
