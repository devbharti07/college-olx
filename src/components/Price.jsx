import React from 'react';
import { formatPrice } from '../utils/formatters';

/**
 * Reusable Product Price Component for Indian College Marketplace.
 * Consistently renders Indian Rupee formatting (e.g. ₹350, ₹1,200).
 */
export default function Price({
  amount,
  className = '',
  freeText = 'Free',
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
}) {
  const formatted = amount === 0 ? freeText : formatPrice(amount);

  const sizeClasses = {
    sm: 'text-xs font-semibold',
    md: 'text-sm font-bold',
    lg: 'text-lg font-bold',
    xl: 'text-2xl font-extrabold',
  };

  return (
    <span className={`tracking-tight ${sizeClasses[size] || sizeClasses.md} ${className}`}>
      {formatted}
    </span>
  );
}
