// Input Sanitization to protect against XSS Attacks
export const sanitizeInput = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>"']/g, (match) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    };
    return map[match];
  });
};

// Email & Password Validation
export const validateAuthForm = (email, password) => {
  const errors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email || !emailRegex.test(email)) {
    errors.email = 'Please enter a valid academic/corporate email address.';
  }
  if (!password || password.length < 6) {
    errors.password = 'Password must be at least 6 characters long.';
  }
  return errors;
};

// Additional Strict Input Sanitization
export const sanitizeInputStrict = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};