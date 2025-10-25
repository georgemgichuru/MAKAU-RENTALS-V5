import { useState, useCallback } from 'react';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callApi = useCallback(async (apiCall, successCallback = null, errorCallback = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall();
      if (successCallback) {
        successCallback(response.data);
      }
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'Something went wrong';
      setError(errorMessage);
      
      if (errorCallback) {
        errorCallback(errorMessage);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    callApi,
    clearError
  };
};