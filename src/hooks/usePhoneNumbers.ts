import { useState, useEffect } from 'react';
import { getPhoneNumbers } from '../services/supabase';

export const usePhoneNumbers = () => {
  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch phone numbers on mount
  useEffect(() => {
    const fetchPhoneNumbers = async () => {
      try {
        setLoading(true);
        const data = await getPhoneNumbers();
        setPhoneNumbers(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchPhoneNumbers();
  }, []);

  // Return the phone numbers data and state
  return {
    phoneNumbers,
    loading,
    error,
    refreshPhoneNumbers: async () => {
      try {
        setLoading(true);
        const data = await getPhoneNumbers();
        setPhoneNumbers(data);
        setError(null);
        return data;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        throw err;
      } finally {
        setLoading(false);
      }
    }
  };
};