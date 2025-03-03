import fs from 'fs';
import path from 'path';

export function getComicFiles(): string[] {
  const comicsDir = path.join(process.cwd(), 'public', 'images', 'Comics');
  try {
    return fs.readdirSync(comicsDir);
  } catch (error) {
    console.error('Errore nel leggere la cartella Comics:', error);
    return [];
  }
} 