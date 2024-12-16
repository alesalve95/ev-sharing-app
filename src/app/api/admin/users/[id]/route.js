import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import Station from '@/lib/models/Station';
import { verifyAdminToken } from '@/lib/auth';

// PATCH - Aggiorna minuti utente
export async function PATCH(req, { params }) {
  try {
    const isAdmin = await verifyAdminToken(req);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await req.json();
    
    await dbConnect();
    
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      );
    }

    if (body.minutes !== undefined) {
      user.minutes = body.minutes;
    }
    if (body.email) {
      user.email = body.email;
    }
    if (body.password) {
      user.password = body.password;
    }

    await user.save();
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento dell\'utente' },
      { status: 500 }
    );
  }
}

// DELETE - Elimina utente e le sue stazioni
export async function DELETE(req, { params }) {
  try {
    const isAdmin = await verifyAdminToken(req);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const { id } = params;
    await dbConnect();

    await Promise.all([
      User.findByIdAndDelete(id),
      Station.deleteMany({ owner: id })
    ]);

    return NextResponse.json({ message: 'Utente eliminato con successo' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione dell\'utente' },
      { status: 500 }
    );
  }
}