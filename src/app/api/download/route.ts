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
    const comicId = searchParams.get('id');

    console.log(`[${new Date().toISOString()}] Inizio richiesta download per comic ID: ${comicId}`);

    if (!comicId) {
      return NextResponse.json({ error: 'ID fumetto non specificato' }, { status: 400 });
    }

    // Leggi il file JSON con i dati dei fumetti
    const comicsDataPath = path.join(process.cwd(), 'public', 'comics-data.json');
    const comicsData = JSON.parse(fs.readFileSync(comicsDataPath, 'utf-8'));
    
    // Trova il fumetto corrispondente
    const comic = comicsData.comics.find((c: any) => c.id === comicId);
    
    if (!comic || !comic.file) {
      console.error(`[${new Date().toISOString()}] Fumetto non trovato:`, comicId);
      return NextResponse.json({ error: 'Fumetto non trovato' }, { status: 404 });
    }

    // Modifica l'URL per usare l'estensione .zip
    const zipUrl = comic.file.replace('.cbz', '.zip');
    console.log(`[${new Date().toISOString()}] Tentativo download da:`, zipUrl);

    // Imposta un timeout per la richiesta
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      // Scarica il file
      const response = await fetch(zipUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/octet-stream',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`[${new Date().toISOString()}] Errore nella risposta:`, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          url: zipUrl
        });
        throw new Error(`Errore nel download del file: ${response.status} ${response.statusText}`);
      }

      // Verifica la dimensione del file
      const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
      if (contentLength > MAX_FILE_SIZE) {
        console.error(`[${new Date().toISOString()}] File troppo grande:`, {
          size: contentLength,
          maxSize: MAX_FILE_SIZE,
          url: zipUrl
        });
        throw new Error(`File troppo grande: ${contentLength} bytes (max: ${MAX_FILE_SIZE} bytes)`);
      }

      // Ottieni il contenuto del file
      const buffer = await response.arrayBuffer();
      console.log(`[${new Date().toISOString()}] File scaricato con successo:`, {
        size: buffer.byteLength,
        timeElapsed: Date.now() - startTime
      });

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
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error(`[${new Date().toISOString()}] Timeout durante il download:`, {
          timeout: TIMEOUT,
          url: zipUrl
        });
        throw new Error(`Timeout durante il download dopo ${TIMEOUT}ms`);
      }
      throw fetchError;
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Errore nel download:`, error);
    return NextResponse.json({ 
      error: 'Errore nel download del fumetto',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 });
  }
} 