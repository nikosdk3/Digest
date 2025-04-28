'use client';

import * as React from 'react';
import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import ReaderContent from '@/app/reader/components/ReaderContent';
import { useEnv } from '@/context/EnvContext';
import { useReaderStore } from '@/store/readerStore';

const ReaderPage = () => {
  const router = useRouter();

  const [isNavBarVisible, setIsNavBarVisible] = useState(false);
  const [isClosingBook, setIsClosingBook] = useState(false);
  const { envConfig } = useEnv();
  const { setLibrary } = useReaderStore();

  const handleBack = () => {
    console.log('Back to bookshelf');
    setIsClosingBook(true);
    router.back();
  };

  const handleTap = () => {
    setIsNavBarVisible((pre) => !pre);
  };

  useEffect(() => {
    const fetchLibrary = async () => {
      const appService = await envConfig.initAppService();
      setLibrary(await appService.loadLibraryBooks());
    };

    fetchLibrary();
  }, [envConfig, setLibrary]);

  return (
    <div className='min-h-screen bg-gray-100'>
      <div
        className={`absolute inset-0 z-20 ${isNavBarVisible ? 'mt-10' : 'ml-20 h-20'}`}
        onClick={handleTap}
      />
      <NavBar onBack={handleBack} isVisible={isNavBarVisible} />
      <Suspense>
        <ReaderContent isClosingBook={isClosingBook} />
      </Suspense>
    </div>
  );
};

export default ReaderPage;
