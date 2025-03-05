import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const comicId = searchParams.get('id');

    if (!comicId) {
      return NextResponse.json({ error: 'ID fumetto non specificato' }, { status: 400 });
    }

    // Leggi il file JSON con i dati dei fumetti
    const comicsDataPath = path.join(process.cwd(), 'public', 'comics-data.json');
    const comicsData = JSON.parse(fs.readFileSync(comicsDataPath, 'utf-8'));
    
    // Trova il fumetto corrispondente
    const comic = comicsData.comics.find((c: any) => c.id === comicId);
    
    if (!comic || !comic.file) {
      console.error('Fumetto non trovato:', comicId);
      return NextResponse.json({ error: 'Fumetto non trovato' }, { status: 404 });
    }

    // Modifica l'URL per usare l'estensione .zip
    const zipUrl = comic.file.replace('.cbz', '.zip');
    console.log('Download del file:', zipUrl);

    // Scarica il file
    const response = await fetch(zipUrl);
    
    if (!response.ok) {
      throw new Error(`Errore nel download del file: ${response.status} ${response.statusText}`);
    }

    // Ottieni il contenuto del file
    const buffer = await response.arrayBuffer();

    // Prepara gli header per il download
    const headers = new Headers();
    headers.set('Content-Type', 'application/x-cbz');
    headers.set('Content-Disposition', `attachment; filename="${comic.title}.cbz"`);
    headers.set('Content-Length', buffer.byteLength.toString());

    // Invia il file
    return new NextResponse(buffer, {
      status: 200,
      headers: headers
    });
  } catch (error) {
    console.error('Errore nel download:', error);
    return NextResponse.json({ 
      error: 'Errore nel download del fumetto',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 });
  }
} 