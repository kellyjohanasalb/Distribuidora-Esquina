import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export default function useCatalogSearch(searchTerm) {
  const [catalogItems, setCatalogItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCatalog = useCallback(async (append = false) => {
    if (!searchTerm || searchTerm.length < 2) return;

    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        description: searchTerm,
        ...(cursor && { cursor }),
        limit: 20,
      });

      const res = await axios.get(`/api/products/catalog?${query.toString()}`);
      const data = res.data;

      // Revisa si la estructura es data.products o data.items según tu backend
      setCatalogItems(prev =>
        append ? [...prev, ...data.products] : data.products
      );
      setCursor(data.pagination?.nextCursor || null);
      setHasNextPage(data.pagination?.hasNextPage || false);
    } catch (error) {
      console.error('Error al obtener el catálogo con Axios', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, cursor]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      setCatalogItems([]);
      setCursor(null);
      fetchCatalog(false);
    } else {
      setCatalogItems([]);
      setCursor(null);
      setHasNextPage(false);
    }
  }, [searchTerm, fetchCatalog]);

  return {
    catalogItems,
    fetchMore: () => fetchCatalog(true),
    hasNextPage,
    isLoading,
  };
}
