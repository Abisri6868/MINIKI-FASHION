import { useEffect } from 'react';

const usePageTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} | MINIKI FASHION` : 'MINIKI FASHION | Designer Boutique';
  }, [title]);
};

export default usePageTitle;
