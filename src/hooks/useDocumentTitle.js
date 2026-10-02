import { useEffect } from 'react';

/**
 * Custom hook to dynamically update page document title.
 * @param {string} title 
 */
export const useDocumentTitle = (title) => {
  useEffect(() => {
    const previousTitle = document.title;
    if (title) {
      document.title = `${title} | Campus Classifieds`;
    }
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};
