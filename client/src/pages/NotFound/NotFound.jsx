import React from 'react';
import { Link } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';

const NotFound = () => {
  usePageTitle('Page Not Found');

  return (
    <div className="container-custom py-24 text-center">
      <h1 className="text-8xl font-heading font-bold text-pink-200">404</h1>
      <h2 className="text-2xl font-heading font-bold mt-4 mb-3">Page Not Found</h2>
      <p className="text-gray-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn-primary inline-flex">Back to Home</Link>
    </div>
  );
};

export default NotFound;
