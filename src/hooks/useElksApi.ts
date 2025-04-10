import { useState } from 'react';
import * as elksApi from '../services/elksApi';

export function useElksApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Send a single SMS
  const sendSms = async (
    to: string,
    message: string,
    options?: {
      from?: string;
      flashsms?: boolean;
      whendelivered?: string;
      dryrun?: boolean;
    }
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await elksApi.sendSms(to, message, options);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      throw err;
    }
  };

  // Get SMS history
  const getSmsHistory = async (start?: string, end?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await elksApi.getSmsHistory(start, end);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      throw err;
    }
  };

  // Get a specific SMS by ID
  const getSmsById = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await elksApi.getSmsById(id);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      throw err;
    }
  };

  // Configure webhook URLs for a virtual phone number
  const configurePhoneNumber = async (
    phoneNumber: string,
    options: {
      smsUrl?: string;
      mmsUrl?: string;
      voiceStart?: string;
      smsReplies?: boolean;
    }
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await elksApi.configurePhoneNumber(phoneNumber, options);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      throw err;
    }
  };

  // Estimate SMS cost and message parts
  const estimateSmsDetails = async (
    message: string,
    to: string,
    from?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await elksApi.estimateSmsDetails(message, to, from);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      throw err;
    }
  };

  // Calculate SMS metrics locally (without API call)
  const calculateSmsMetrics = (text: string) => {
    return elksApi.calculateSmsMetrics(text);
  };

  // Send a bulk SMS campaign
  const sendBulkSms = async (
    recipients: Array<{ to: string; message: string }>,
    from?: string,
    whendelivered?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await elksApi.sendBulkSms(recipients, from, whendelivered);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      throw err;
    }
  };

  return {
    loading,
    error,
    sendSms,
    getSmsHistory,
    getSmsById,
    configurePhoneNumber,
    estimateSmsDetails,
    calculateSmsMetrics,
    sendBulkSms,
  };
}