import React from 'react';
import { FaPlus } from 'react-icons/fa';
import { Book, BooksGroup } from '../types/book';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type BookshelfItem = Book | BooksGroup;

const UNGROUPED_NAME = 'ungrouped';

// const MOCK_BOOKS: Book[] = Array.from({ length: 14 }, (_, k) => ({
//   hash: `book-${k}`,
//   format: 'EPUB',
//   title: `Book ${k}`,
//   author: `Author ${k}`,
//   lastUpdated: Date.now() - 1000000 * k,
//   coverImageUrl: `https://placehold.co/800?text=Book+${k}&font=roboto`,
// }));

const generateBookshelfItems = (books: Book[]): BookshelfItem[] => {
  const groups: BooksGroup[] = books.reduce((acc: BooksGroup[], book: Book) => {
    book.group = book.group || UNGROUPED_NAME;
    const groupIndex = acc.findIndex((group) => group.name === book.group);
    const booksGroup = acc[groupIndex];
    if (booksGroup) {
      booksGroup.books.push(book);
      booksGroup.lastUpdated = Math.max(acc[groupIndex]!.lastUpdated, book.lastUpdated);
    } else {
      const group = {
        name: book.group,
        books: [book],
        lastUpdated: book.lastUpdated,
      };
      acc.push(group);
    }
    return acc;
  }, []);
  const ungroupedBooks: Book[] = groups.find((group) => group.name === UNGROUPED_NAME)?.books || [];
  const groupedBooks: BooksGroup[] = groups.filter((group) => group.name !== UNGROUPED_NAME);
  return [...ungroupedBooks, ...groupedBooks].sort((a, b) => b.lastUpdated - a.lastUpdated);
};

interface BookshelfProps {
  libraryBooks: Book[];
  onImportBooks: () => void;
}

const Bookshelf: React.FC<BookshelfProps> = ({ libraryBooks, onImportBooks }) => {
  const router = useRouter();

  const bookshelfItems = generateBookshelfItems(libraryBooks);

  const handleBookClick = (id: string) => {
    router.push(`/reader?id=${id}`);
  };

  return (
    <div className='bookshelf'>
      {/* Books Grid */}
      <div className='grid grid-cols-3 gap-6 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8'>
        {bookshelfItems.map((item, index) => (
          <div key={`library-item-${index}`} className=''>
            <div className='grid gap-2'>
              {'format' in item ? (
                <div className='bookItem' onClick={() => handleBookClick(item.hash)}>
                  <div key={(item as Book).hash} className='card bg-base-100 w-full shadow-md'>
                    <Image
                      width={10}
                      height={10}
                      src={(item as Book).coverImageUrl!}
                      alt={(item as Book).title}
                      className='aspect-[28/41] w-full object-cover'
                    />
                  </div>
                  <div className='card-body p-0 pt-2'>
                    <h3 className='card-title line-clamp-1 text-sm'>{(item as Book).title}</h3>
                  </div>
                </div>
              ) : (
                <div>
                  {(item as BooksGroup).books.map((book) => (
                    <div key={book.hash} className='card bg-base-100 w-full shadow-md'>
                      <figure>
                        <Image
                          width={10}
                          height={10}
                          src={book.coverImageUrl!}
                          alt={book.title}
                          className='h-48 w-full shadow-md'
                        />
                      </figure>
                    </div>
                  ))}
                  <h2 className='mb-2 font-bold'>{(item as BooksGroup).name}</h2>
                </div>
              )}
            </div>
          </div>
        ))}

        {bookshelfItems.length > 0 && (
          <div
            className='flex aspect-[28/41] items-center justify-center border-1 bg-white'
            role='button'
            onClick={onImportBooks}
          >
            <FaPlus size='2rem' color='grey' />
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookshelf;
