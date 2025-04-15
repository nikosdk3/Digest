import React from 'react';
import { FaPlus, FaSearch } from 'react-icons/fa';

interface SearchBarProps {
  onImportBooks: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onImportBooks }) => {
  return (
    <div className='fixed z-10 w-full p-6'>
      <div className='flex items-center justify-between'>
        {/* Search input with Maginfier and Plus Icon */}
        <div className='relative flex w-full items-center'>
          {/*MagnifierIcon*/}
          <span className='absolute left-4 z-[1] text-gray-500'>
            <FaSearch className='w-3' />
          </span>
          {/* Search input */}
          <input
            type='text'
            placeholder='Search Books...'
            className='input input-sm rounded-badge w-full pr-10 pl-10 focus:outline-none'
          />
          {/* Plus icon */}
          <span className='dropdown dropdown-end absolute right-4 cursor-pointer text-gray-500'>
            <FaPlus tabIndex={0} className='w-3' role='button' />
            <ul
              tabIndex={0}
              className='menu dropdown-content rounded-box bg-base-100 z-[1] w-52 p-2 shadow'
            >
              <li>
                <button onClick={onImportBooks}>From Local File</button>
              </li>
            </ul>
          </span>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
