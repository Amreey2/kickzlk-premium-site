export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const isValidPhone = (value) => /^[+\d][\d\s-]{8,14}$/.test(value.trim());
