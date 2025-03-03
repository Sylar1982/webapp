interface Comic {
  id: string;
  title: string;
  coverImage: string;
  spineImage: string;
  spineColor: string;
  filePath: string;
  shelf: number;
  position: number;
}

interface ComicFile {
  id: string;
  costa: string;
  copertina: string;
}

export function generateRandomColor(): string {
  // Genera colori pastello per le coste dei fumetti
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 80%)`;
}

export function parseComicFileName(fileName: string): ComicFile | null {
  const match = fileName.match(/^(\d{4})(COS|COP)/);
  if (!match) return null;

  const [_, id, type] = match;
  return {
    id,
    costa: type === 'COS' ? fileName : '',
    copertina: type === 'COP' ? fileName : ''
  };
}

export function organizeComics(fileNames: string[]): Comic[] {
  const comicsMap = new Map<string, Partial<ComicFile>>();

  // Raggruppa i file per ID
  fileNames.forEach(fileName => {
    const parsed = parseComicFileName(fileName);
    if (!parsed) return;

    if (!comicsMap.has(parsed.id)) {
      comicsMap.set(parsed.id, { id: parsed.id });
    }

    const comic = comicsMap.get(parsed.id)!;
    if (parsed.costa) comic.costa = parsed.costa;
    if (parsed.copertina) comic.copertina = parsed.copertina;
  });

  // Converti in array di Comic e assegna gli scaffali
  return Array.from(comicsMap.values())
    .filter(comic => comic.costa && comic.copertina)
    .sort((a, b) => a.id!.localeCompare(b.id!))
    .map((comic, index) => ({
      id: comic.id!,
      title: `Fumetto ${comic.id}`,
      coverImage: `/images/Comics/${comic.copertina}`,
      spineImage: `/images/Comics/${comic.costa}`,
      spineColor: generateRandomColor(),
      filePath: '', // Da implementare per CBR/CBZ
      shelf: Math.floor(index / 10) + 1, // 10 fumetti per scaffale
      position: index % 10
    }));
} 