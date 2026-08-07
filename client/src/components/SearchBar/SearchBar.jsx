import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';

const SearchBar = ({ onSearch }) => {
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/shop?keyword=${encodeURIComponent(keyword.trim())}`);
      onSearch?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-xl mx-auto">
      <div className="relative flex-1">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search for sarees, kurtis, bridal wear..."
          className="input-field pl-11"
          autoFocus
        />
      </div>
      <button type="submit" className="btn-primary !py-2.5 !px-5">Search</button>
    </form>
  );
};

export default SearchBar;
