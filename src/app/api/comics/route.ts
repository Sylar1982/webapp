import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const comicsDir = path.join(process.cwd(), 'public', 'images', 'Comics');
    const files = fs.readdirSync(comicsDir);
    
    // Leggi il file JSON con i dati dei fumetti
    const comicsDataPath = path.join(process.cwd(), 'public', 'comics-data.json');
    const comicsData = JSON.parse(fs.readFileSync(comicsDataPath, 'utf-8'));
    
    // Raggruppa i file per ID
    const comicsByID = files.reduce((acc: { [key: string]: any }, file: string) => {
      // Regex più flessibile che accetta qualsiasi carattere tra COS/COP e .jpg
      const match = file.match(/^(\d{4})(COS|COP)(.+)\.(jpg|JPG)$/i);
      if (match) {
        const [_, id, type, title] = match;
        if (!acc[id]) {
          // Rimuove eventuali numeri alla fine del titolo (es. _724 o _001)
          const cleanTitle = title.replace(/^_/, '').replace(/_\d+$/, '').replace(/_/g, ' ');
          acc[id] = { id, title: cleanTitle, files: {} };
        }
        acc[id].files[type] = file;
      }
      return acc;
    }, {});

    const basePath = process.env.NODE_ENV === 'production' ? '/webapp' : '';

    // Crea l'array di fumetti
    const comics = Object.values(comicsByID).map((comic: any, index: number) => {
      // Trova il file corrispondente nel JSON
      const comicData = comicsData.comics.find((c: any) => c.id === comic.id);
      
      return {
        id: comic.id,
        title: comic.title,
        spineImage: `${basePath}/images/Comics/${comic.files.COS}`,
        coverImage: comic.files.COP ? `${basePath}/images/Comics/${comic.files.COP}` : `${basePath}/images/Comics/${comic.files.COS}`,
        filePath: comicData ? `${basePath}${comicData.file}` : null,
        shelf: 0,
        position: index
      };
    });

    console.log('Files trovati:', files);
    console.log('Comics raggruppati:', comicsByID);
    console.log('Comics array:', comics);

    return NextResponse.json(comics);
  } catch (error) {
    console.error('Errore nel caricamento dei fumetti:', error);
    return NextResponse.json({ error: 'Errore nel caricamento dei fumetti' }, { status: 500 });
  }
} 