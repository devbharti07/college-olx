/**
 * Utility functions for Indian College Marketplace (INR formatting, dates, text).
 * All prices strictly formatted in Indian Rupees (₹).
 */

/**
 * Reusable Indian Rupee (INR) Price Formatter
 * Examples:
 *   formatPrice(350)   -> "₹350"
 *   formatPrice(1200)  -> "₹1,200"
 *   formatPrice(25000) -> "₹25,000"
 *   formatPrice(0)     -> "Free"
 */
export const formatPrice = (amount) => {
  if (amount === undefined || amount === null || amount === '') return '₹0';
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num)) return '₹0';
  if (num === 0) return 'Free';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatDate = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};
