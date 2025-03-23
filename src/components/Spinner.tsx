import React from 'react';

interface SpinnerProps {
  loading: boolean;
}

const Spinner: React.FC<SpinnerProps> = ({ loading }) => {
  if (!loading) return null;
  return (
    <div className='absolute top-4 left-1/2 transform pt-16 text-center' role='status'>
      <span className='loading loading-dots loading-lg' />
      <span className='hidden'>Loading...</span>
    </div>
  );
};

export default Spinner;
