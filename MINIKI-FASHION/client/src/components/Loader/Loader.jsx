import React from 'react';

const Loader = ({ fullScreen = false, size = 'md' }) => {
  const sizes = { sm: 'h-6 w-6 border-2', md: 'h-10 w-10 border-4', lg: 'h-16 w-16 border-4' };

  const spinner = (
    <div className={`${sizes[size]} rounded-full border-pink-200 border-t-pink-600 animate-spin`} />
  );

  if (fullScreen) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-10">{spinner}</div>;
};

export default Loader;
