'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Comic {
  id: string;
  title: string;
  coverImage: string;
  spineImage: string;
  spineColor: string;
  file: string;
  shelf: number;
  position: number;
  dimensions?: {
    width: number;
    height: number;
    aspectRatio: number;
  };
}

// Configurazione dettagliata degli scaffali
const SHELF_CONFIG = {
  // Dimensioni di riferimento dell'immagine della libreria
  libraryImage: {
    width: 960,    // Larghezza di riferimento dell'immagine
    height: 1280,  // Altezza di riferimento dell'immagine
    aspectRatio: 960 / 1280
  },
  shelves: [
    { 
      id: 0,
      coordinates: {
        x: 356,
        y: 344,
        shelfWidth: 180  // Larghezza totale dello scaffale
      },
      height: 88,       // Altezza dei fumetti
      width: 15,        // Aumentata la larghezza dei fumetti
      maxComics: 3      // Impostato il massimo a 3 fumetti
    }
  ]
};

export default function ComicShelf() {
  const [selectedComic, setSelectedComic] = useState<Comic | null>(null);
  const [selectedShelf, setSelectedShelf] = useState<number | null>(null);
  const [comics, setComics] = useState<Comic[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Aggiungo un useEffect per il logging del fumetto selezionato
  useEffect(() => {
    if (selectedComic) {
      console.log('Dati del fumetto selezionato:', selectedComic);
      console.log('File del fumetto:', selectedComic.file);
    }
  }, [selectedComic]);

  // Gestisce il ridimensionamento della finestra
  useEffect(() => {
    function handleResize() {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }

    handleResize(); // Imposta le dimensioni iniziali
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Precarica le immagini e calcola le dimensioni
  const preloadImages = async (comicsData: Comic[]) => {
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        console.log('Tentativo di caricamento immagine:', src);
        const img = new Image();
        img.onload = () => {
          console.log(`✅ Immagine caricata con successo: ${src}`, {
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            aspectRatio: img.naturalWidth / img.naturalHeight
          });
          resolve(img);
        };
        img.onerror = (error) => {
          console.error(`❌ Errore nel caricamento dell'immagine: ${src}`, error);
          reject(error);
        };
        // Rimuoviamo /webapp/ dall'URL dell'immagine se presente
        img.src = src.replace('/webapp/', '/');
      });
    };

    try {
      console.log('Inizio caricamento immagini per i fumetti:', comicsData);
      const comicsWithDimensions = await Promise.all(
        comicsData.map(async (comic) => {
          try {
            console.log(`Caricamento immagine per ${comic.title}:`, comic.spineImage);
            const img = await loadImage(comic.spineImage);
            const dimensions = {
              width: img.naturalWidth,
              height: img.naturalHeight,
              aspectRatio: img.naturalWidth / img.naturalHeight
            };
            console.log(`✅ Dimensioni salvate per ${comic.title}:`, dimensions);
            return {
              ...comic,
              dimensions
            };
          } catch (error) {
            console.error(`❌ Errore nel caricamento dell'immagine per ${comic.title}:`, error);
            return comic;
          }
        })
      );
      console.log('Fumetti con dimensioni:', comicsWithDimensions);
      setComics(comicsWithDimensions);
    } catch (error) {
      console.error('Errore nel caricamento delle dimensioni delle immagini:', error);
      setComics(comicsData);
    }
  };

  useEffect(() => {
    async function loadComics() {
      try {
        const response = await fetch('/api/comics');
        const data = await response.json();
        console.log('Comics caricati:', data);
        await preloadImages(data);
      } catch (error) {
        console.error('Errore nel caricamento dei fumetti:', error);
      }
    }

    loadComics();
  }, []);

  // Organizza i fumetti per scaffale
  const comicsByShelf = comics.reduce((acc, comic) => {
    const shelfIndex = Math.min(
      Math.floor((comic.position) / SHELF_CONFIG.shelves[0].maxComics),
      SHELF_CONFIG.shelves.length - 1
    );
    if (!acc[shelfIndex]) {
      acc[shelfIndex] = [];
    }
    acc[shelfIndex].push(comic);
    console.log(`Fumetto ${comic.id} assegnato allo scaffale ${shelfIndex}, posizione ${comic.position}`);
    return acc;
  }, {} as Record<number, Comic[]>);

  console.log('Fumetti organizzati per scaffale:', comicsByShelf);

  // Calcola le dimensioni dei fumetti in base allo zoom e alle proporzioni dell'immagine
  const getComicDimensions = (comic: Comic, shelf: typeof SHELF_CONFIG.shelves[0], isZoomed: boolean) => {
    const baseHeight = shelf.height;
    const baseMultiplier = isZoomed ? 3 : 1;
    
    // Se abbiamo le dimensioni dell'immagine, usa quelle per calcolare la larghezza proporzionale
    if (comic.dimensions) {
      // Calcoliamo la larghezza mantenendo l'aspect ratio dell'immagine originale
      const width = baseHeight * comic.dimensions.aspectRatio;
      console.log(`Calcolo dimensioni per ${comic.title}:`, {
        dimensions: comic.dimensions,
        baseHeight,
        width,
        isZoomed,
        finalWidth: width * baseMultiplier,
        finalHeight: baseHeight * baseMultiplier
      });
      return {
        height: baseHeight * baseMultiplier,
        width: width * baseMultiplier
      };
    }
    
    // Fallback alle dimensioni di default se non abbiamo le dimensioni dell'immagine
    console.warn(`Dimensioni non trovate per ${comic.title}, uso default`);
    return {
      height: baseHeight * baseMultiplier,
      width: shelf.width * baseMultiplier
    };
  };

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden flex items-center justify-center">
      {/* Immagine della libreria fissa */}
      <div 
        className="relative"
        style={{
          width: '100%',
          maxWidth: '960px',
          aspectRatio: `${SHELF_CONFIG.libraryImage.width} / ${SHELF_CONFIG.libraryImage.height}`,
        }}
      >
        <img 
          src="/images/libreria-design.jpg"
          alt="Libreria"
          className="w-full h-full object-contain"
          id="libraryImage"
        />
      </div>

      {/* Container per i fumetti con zoom */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center"
        style={{
          pointerEvents: 'none'
        }}
      >
        {/* Overlay per tornare alla visuale da lontano quando si è in modalità zoom */}
        <AnimatePresence>
          {selectedShelf !== null && !selectedComic && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0"
              style={{ 
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                zIndex: 40,
                pointerEvents: 'auto'
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setSelectedShelf(null);
                }
              }}
            />
          )}
        </AnimatePresence>

        <div 
          className="relative mx-auto"
          style={{
            width: '100%',
            maxWidth: '960px',
            aspectRatio: `${SHELF_CONFIG.libraryImage.width} / ${SHELF_CONFIG.libraryImage.height}`,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 41,
            pointerEvents: 'none'
          }}
        >
          {SHELF_CONFIG.shelves.map((shelf, shelfIndex) => {
            const isShelfSelected = selectedShelf === shelfIndex;
            const shelfComics = comicsByShelf[shelfIndex] || [];
            
            const defaultDimensions = {
              height: shelf.height * (isShelfSelected ? 3 : 1),
              width: shelf.width * (isShelfSelected ? 3 : 1)
            };
            
            const xPercentage = (shelf.coordinates.x / SHELF_CONFIG.libraryImage.width) * 100;
            const yPercentage = (shelf.coordinates.y / SHELF_CONFIG.libraryImage.height) * 100;
            
            return (
              <motion.div 
                key={shelfIndex}
                className="absolute"
                style={{
                  top: `${yPercentage}%`,
                  left: `${xPercentage}%`,
                  width: `${(shelf.coordinates.shelfWidth / SHELF_CONFIG.libraryImage.width) * 100}%`,
                  height: `${defaultDimensions.height}px`,
                  pointerEvents: !selectedComic ? 'auto' : 'none',
                  zIndex: isShelfSelected ? 42 : 1,
                  backgroundColor: 'transparent'
                }}
                animate={{
                  scale: isShelfSelected ? 2 : 1,
                  y: isShelfSelected ? shelf.height * 1.5 : 0
                }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                onClick={(e) => {
                  // Se il click è direttamente sullo scaffale o sul container dei fumetti
                  if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('shelf-container')) {
                    if (isShelfSelected) {
                      setSelectedShelf(null);
                    } else {
                      setSelectedShelf(shelfIndex);
                    }
                  }
                }}
              >
                <div 
                  className="flex items-end h-full w-full shelf-container"
                  style={{
                    pointerEvents: isShelfSelected ? 'auto' : 'none'
                  }}
                >
                  {shelfComics.map((comic, index) => {
                    const { height, width } = getComicDimensions(comic, shelf, isShelfSelected);
                    return (
                      <motion.div
                        key={comic.id}
                        layoutId={`comic-${comic.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isShelfSelected && !selectedComic) {
                            setSelectedComic(comic);
                          } else if (!selectedShelf) {
                            setSelectedShelf(shelfIndex);
                          }
                        }}
                        className={`cursor-pointer transform transition-transform ${
                          isShelfSelected && !selectedComic ? 'hover:translate-y-[-5px]' : ''
                        }`}
                        style={{ 
                          height: `${height}px`,
                          width: `${width}px`,
                          flexShrink: 0,
                          pointerEvents: 'auto'
                        }}
                        whileHover={{ scale: isShelfSelected && !selectedComic ? 1.05 : 1 }}
                      >
                        <img 
                          src={comic.spineImage.replace('/webapp/', '/')}
                          alt={comic.title}
                          className="h-full w-full object-fill"
                          style={{
                            imageRendering: 'crisp-edges'
                          }}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Modale per la visualizzazione del fumetto */}
      <AnimatePresence>
        {selectedComic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            onClick={() => setSelectedComic(null)}
          >
            <div className="absolute inset-0 bg-black bg-opacity-75" />
            <div className="relative w-full h-full flex items-center justify-center">
              <motion.div
                layoutId={`comic-${selectedComic.id}`}
                className="bg-white rounded-lg p-6 w-96 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={selectedComic.coverImage.replace('/webapp/', '/')}
                  alt={selectedComic.title}
                  className="w-full h-auto rounded shadow-lg"
                />
                <h2 className="text-2xl font-bold mt-6 mb-4">{selectedComic.title}</h2>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Apertura link:', selectedComic.file);
                    if (selectedComic.file) {
                      window.open(selectedComic.file, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Leggi
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 