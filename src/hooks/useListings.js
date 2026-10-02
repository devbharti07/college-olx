import { useContext } from 'react';
import { ListingContext } from '../context/ListingContextObject';

export const useListings = () => {
  const context = useContext(ListingContext);
  if (!context) {
    throw new Error('useListings must be used within a ListingProvider');
  }
  return context;
};

export default useListings;
