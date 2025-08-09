import { useState, useEffect, useCallback } from 'react';
import { 
  getAccessLogs, 
  getCurrentCapacity, 
  healthCheck,
  AccessLog,
} from '@/lib/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: unknown[] = [],
  autoFetch: boolean = true
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('API call failed:', err);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  return { data, loading, error, refetch };
}

// Specific hooks for common API calls
export const useAccessLogs = () => {
  return useApi(getAccessLogs);
};

export const useCapacityData = () => {
  return useApi(getCurrentCapacity);
};

export const useHealthCheck = () => {
  return useApi(healthCheck);
};

// Hook for calculated today's stats
export const useTodaysStats = () => {
  return useApi(async () => {
    try {
      const logsResponse = await getAccessLogs();
      if (!logsResponse.success || !logsResponse.data) {
        return { totalEntries: 0, lastScanTime: null };
      }

      const today = new Date().toDateString();
      const todaysLogs = logsResponse.data.filter(log => 
        new Date(log.timestamp).toDateString() === today
      );

      return {
        totalEntries: todaysLogs.filter(log => log.action === 'ENTRY' && log.validationResult === 'SUCCESS').length,
        lastScanTime: todaysLogs.length > 0 
          ? new Date(todaysLogs[0].timestamp).toLocaleString()
          : 'No recent activity'
      };
    } catch (error) {
      console.error('Error calculating today\'s stats:', error);
      return { totalEntries: 0, lastScanTime: 'No recent activity' };
    }
  });
};

// Hook for current occupants
export const useCurrentOccupants = () => {
  return useApi(async () => {
    try {
      const logsResponse = await getAccessLogs();
      if (!logsResponse.success || !logsResponse.data) {
        return [];
      }

      // Calculate current occupants based on entry/exit logs
      const userActivity: { [key: string]: { lastAction: string; log: AccessLog } } = {};
      
      logsResponse.data.forEach(log => {
        if (log.validationResult === 'SUCCESS') {
          if (!userActivity[log.userId] || 
              new Date(log.timestamp) > new Date(userActivity[log.userId].log.timestamp)) {
            userActivity[log.userId] = { lastAction: log.action, log };
          }
        }
      });

      const calculateDuration = (entryTime: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - entryTime.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${diffHours}h ${diffMinutes}m`;
      };

      const currentOccupants = Object.values(userActivity)
        .filter(activity => activity.lastAction === 'ENTRY')
        .map(activity => ({
          id: parseInt(activity.log.userId),
          name: activity.log.user.name,
          plan: activity.log.subscription.plan.name,
          entryTime: new Date(activity.log.timestamp).toLocaleTimeString(),
          duration: calculateDuration(new Date(activity.log.timestamp))
        }));

      return currentOccupants;
    } catch (error) {
      console.error('Error getting current occupants:', error);
      return [];
    }
  });
};
