/**
 * Date utility functions for consistent timezone handling
 */

/**
 * Normalizes a date string to ensure consistent parsing as local time
 * Converts "2025-12-10 15:23:00" to "2025-12-10T15:23:00"
 */
const normalizeDateString = (dateString: string): string => {
  return dateString.replace(' ', 'T');
};

/**
 * Formats a date string for display
 */
export const formatDateTime = (dateString: string): string => {
  const normalizedDate = normalizeDateString(dateString);
  return new Date(normalizedDate).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Calculates and formats the time remaining until a given end date
 */
export const formatTimeRemaining = (endDate: string): string => {
  const now = new Date();
  const normalizedDate = normalizeDateString(endDate);
  const end = new Date(normalizedDate);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) {
    return 'Expired';
  }

  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  const parts = [];
  if (years > 0) parts.push(`${years}yr`);
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.length > 0 ? parts.join(':') : 'Less than a minute';
};
