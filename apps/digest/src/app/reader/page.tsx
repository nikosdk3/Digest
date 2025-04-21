'use client';

import * as React from 'react';
import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import ReaderContent from '@/components/ReaderContent';

const ReaderPage = () => {
  const router = useRouter();
  const [isNavBarVisible, setIsNavBarVisible] = useState(false);

  const handleBack = () => {
    console.log('Back to bookshelf');
    router.back();
  };

  const handleTap = () => {
    setIsNavBarVisible((pre) => !pre);
  };

  return (
    <div className='min-h-screen bg-gray-100'>
      <div
        className={`absolute inset-0 z-20 ${isNavBarVisible ? 'mt-10' : 'ml-20 h-20'}`}
        onClick={handleTap}
      />
      <NavBar onBack={handleBack} isVisible={isNavBarVisible} />
      <Suspense>
        <ReaderContent />
      </Suspense>
    </div>
  );
};

export default ReaderPage;
