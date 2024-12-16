import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import Station from '@/lib/models/Station';
import { verifyAdminToken } from '@/lib/auth';

export async function GET(req) {
  try {
    // Verifica token admin
    const isAdmin = await verifyAdminToken(req);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Ottieni tutti gli utenti e le stazioni
    const [users, stations] = await Promise.all([
      User.find().select('-password'),
      Station.find().populate('owner', 'fullName')
    ]);

    return NextResponse.json({ users, stations });
  } catch (error) {
    console.error('Admin data fetch error:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero dei dati' },
      { status: 500 }
    );
  }
}
