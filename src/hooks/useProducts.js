import { useEffect, useState } from 'react';
import { productsApi } from '../services/api';

const initialCollection = { products: [], loading: true, error: null };

export function useProducts(filters = {}) {
  const filterKey = JSON.stringify(filters);
  const [state, setState] = useState(initialCollection);

  useEffect(() => {
    let active = true;
    productsApi.list(JSON.parse(filterKey)).then(
      (products) => active && setState({ products, loading: false, error: null }),
      (error) => active && setState({ products: [], loading: false, error }),
    );
    return () => { active = false; };
  }, [filterKey]);

  return state;
}

export function useProduct(slug) {
  const [state, setState] = useState({ product: null, loading: true, error: null });

  useEffect(() => {
    let active = true;
    productsApi.get(slug).then(
      (product) => active && setState({ product, loading: false, error: null }),
      (error) => active && setState({ product: null, loading: false, error }),
    );
    return () => { active = false; };
  }, [slug]);

  return state;
}
