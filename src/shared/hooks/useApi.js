import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for API calls with loading and error states
 */
export function useApi(apiFunction, immediate = false) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFunction(...args);
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return { data, loading, error, execute, setData };
}

/**
 * Custom hook for paginated data
 */
export function usePaginatedData(apiFunction, initialParams = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [params, setParams] = useState(initialParams);

  const fetchData = useCallback(async (newParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const mergedParams = { ...params, ...newParams };
      const response = await apiFunction(mergedParams);
      const results = response.data.results || response.data;
      
      if (newParams.page > 1) {
        setData(prev => [...prev, ...results]);
      } else {
        setData(results);
      }
      
      setHasMore(results.length >= (mergedParams.page_size || 20));
      setParams(mergedParams);
      return response.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, params]);

  const refresh = useCallback(() => {
    return fetchData({ page: 1 });
  }, [fetchData]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      return fetchData({ page: (params.page || 1) + 1 });
    }
  }, [fetchData, loading, hasMore, params.page]);

  return { data, loading, error, hasMore, params, fetchData, refresh, loadMore, setData };
}

/**
 * Custom hook for CRUD operations
 */
export function useCrud(service, options = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAll = useCallback(async (params) => {
    setLoading(true);
    try {
      const response = await service.getAll?.(params) || await service.getList?.(params);
      setItems(response.data.results || response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const create = useCallback(async (data) => {
    setActionLoading(true);
    try {
      const response = await service.create(data);
      setItems(prev => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [service]);

  const update = useCallback(async (id, data) => {
    setActionLoading(true);
    try {
      const response = await service.update(id, data);
      setItems(prev => prev.map(item => item.id === id ? response.data : item));
      return response.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [service]);

  const remove = useCallback(async (id) => {
    setActionLoading(true);
    try {
      await service.delete(id);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [service]);

  const getOne = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await service.getOne?.(id) || await service.get?.(id);
      return response.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    if (options.immediate) {
      fetchAll(options.params);
    }
  }, [options.immediate, options.params, fetchAll]);

  return {
    items,
    loading,
    error,
    actionLoading,
    fetchAll,
    create,
    update,
    remove,
    getOne,
    setItems
  };
}

/**
 * Custom hook for form handling with validation
 */
export function useForm(initialValues = {}, validate = () => ({})) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (touched[name]) {
      const newErrors = validate({ ...values, [name]: type === 'checkbox' ? checked : value });
      setErrors(prev => ({ ...prev, [name]: newErrors[name] }));
    }
  }, [values, touched, validate]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const newErrors = validate(values);
    setErrors(prev => ({ ...prev, [name]: newErrors[name] }));
  }, [values, validate]);

  const handleSubmit = useCallback((onSubmit) => (e) => {
    e.preventDefault();
    setTouched(Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    const newErrors = validate(values);
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      return onSubmit(values);
    }
  }, [values, validate]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValue,
    setValues
  };
}

/**
 * Custom hook for WebSocket connections
 */
export function useWebSocket(url, onMessage, onConnect, onDisconnect) {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const wsUrl = `${url}?token=${token}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setConnected(true);
      setError(null);
      onConnect?.();
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage?.(data);
    };

    socket.onclose = () => {
      setConnected(false);
      onDisconnect?.();
    };

    socket.onerror = (err) => {
      setError(err);
    };

    wsRef.current = socket;

    return () => {
      wsRef.current = null;
      socket.close();
    };
  }, [url, onMessage, onConnect, onDisconnect]);

  const send = useCallback((data) => {
    const socket = wsRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    }
  }, []);

  return { wsRef, connected, error, send };
}

/**
 * Custom hook for debounced values
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for local storage
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
