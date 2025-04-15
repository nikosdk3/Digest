'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { BookDoc, DocumentLoader } from '@/libs/document';
import { BookContent } from '@/types/book';
import FoliateViewer from './FoliateViewer';

interface ReaderContentProps {
  content: BookContent;
}

const ReaderContent: React.FC<ReaderContentProps> = ({ content }) => {
  const [bookDoc, setBookDoc] = useState<BookDoc>();

  useEffect(() => {
    const loadDocument = async () => {
      if (content.file) {
        const { book } = await new DocumentLoader(content.file).open();
        setBookDoc(book);
      }
    };

    loadDocument();
  }, [content.file]);

  if (!content.file || !bookDoc) {
    return null;
  }

  return (
    <div>
      <FoliateViewer book={bookDoc} />
    </div>
  );
};

export default ReaderContent;
