'use client';

import * as React from 'react';
import { useState } from 'react';
import { useEnv } from '../context/EnvContext';
import { Book } from '../types/book';
import Navbar from '@/components/Navbar';
import Spinner from '@/components/Spinner';
import Bookshelf from '@/components/Bookshelf';

type AppState = 'Init' | 'Loading' | 'Library' | 'Reader';

const LibraryPage = () => {
  const { envConfig } = useEnv();
  const [appState, setAppState] = useState<AppState>('Init');
  const [libraryBooks, setLibraryBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  React.useEffect(() => {
    if (appState !== 'Init') return;
    setAppState('Loading');
    envConfig.appService().then((appService) => {
      appService.loadSettings().then((settings) => {
        console.log('Settings', settings);
        appService
          .loadLibraryBooks()
          .then((libraryBooks) => {
            setLibraryBooks(libraryBooks);
            setAppState('Library');
            setLoading(false);
          })
          .catch((err) => {
            console.error(err);
            setLoading(false);
            appService.showMessage(`Failed to load library books: ${err}`, 'error');
          });
      });
    });
  }, [envConfig, appState]);

  const handleImportBooks = async () => {
    console.log('Importing books...');
    const appService = await envConfig.appService();
    appService.selectFiles('Select Books', ['epub', 'pdf']).then(async (files) => {
      setLoading(true);
      for (const file of files) {
        appService.importBook(file, libraryBooks);
        setLibraryBooks(libraryBooks);
      }
      setLoading(false);
    });
  };

  return (
    <div className='min-h-screen'>
      <Navbar onImportBooks={handleImportBooks} />
      <div className='min-h-screen p-2 pt-16'>
        <div className='hero-content'>
          <Spinner loading={loading} />
          <Bookshelf libraryBooks={libraryBooks} onImportBooks={handleImportBooks} />
        </div>
        {!loading && libraryBooks.length === 0 && (
          <div className='hero min-h-screen'>
            <div className='hero-content text-neutral-content text-center'>
              <div className='max-w-md'>
                <h1 className='mb-5 text-5xl font-bold'>Your Library</h1>
                <p className='mb-5'>
                  Welcome to your library. You can upload your books here and read them anytime.
                </p>
                <button className='btn btn-primary' onClick={handleImportBooks}>
                  Upload Books
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryPage;
