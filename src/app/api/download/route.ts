import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Configurazione
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB (limite Vercel)
const TIMEOUT = 50 * 1000; // 50 secondi (limite Vercel è 60s)

export async function GET(request: Request) {
  try {
    const startTime = Date.now();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    console.log(`[${new Date().toISOString()}] Inizio richiesta download per comic ID: ${id}`);

    if (!id) {
      console.error('ID fumetto non fornito');
      return NextResponse.json(
        { error: 'ID fumetto non fornito' },
        { status: 400 }
      );
    }

    // Leggi il file JSON con i dati dei fumetti
    const comicsDataPath = path.join(process.cwd(), 'public', 'comics-data.json');
    const comicsData = JSON.parse(fs.readFileSync(comicsDataPath, 'utf8'));

    // Trova il fumetto con l'ID specificato
    const comic = comicsData.comics.find((c: any) => c.id === id);

    if (!comic || !comic.file) {
      console.error(`Fumetto non trovato o URL file mancante per ID: ${id}`);
      return NextResponse.json(
        { error: 'Fumetto non trovato' },
        { status: 404 }
      );
    }

    console.log(`Tentativo di download del file: ${comic.file}`);

    // Aggiungi gli header necessari per la richiesta
    const headers = {
      'Accept': '*/*',
      'Accept-Encoding': 'gzip, deflate, br',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': new URL(comic.file).origin
    };

    // Effettua la richiesta al server remoto
    const response = await fetch(comic.file, { headers });

    if (!response.ok) {
      console.error(`Errore nel download del file: ${response.status} ${response.statusText}`);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      return NextResponse.json(
        { 
          error: 'Errore nel download del fumetto',
          details: `Errore nel download del file: ${response.status} ${response.statusText}`,
          headers: Object.fromEntries(response.headers.entries())
        },
        { status: response.status }
      );
    }

    // Ottieni il tipo di contenuto dalla risposta o usa un default
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Ottieni il nome del file dall'URL o usa un default
    const fileName = comic.file.split('/').pop() || 'comic.cbz';

    // Crea la risposta con gli header appropriati
    const fileData = await response.arrayBuffer();
    return new NextResponse(fileData, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': response.headers.get('content-length') || String(fileData.byteLength)
      }
    });

  } catch (error) {
    console.error('Errore durante il download:', error);
    return NextResponse.json(
      { 
        error: 'Errore nel download del fumetto',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    );
  }
} 