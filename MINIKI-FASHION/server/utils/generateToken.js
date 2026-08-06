const jwt = require('jsonwebtoken');

// Token Generation
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Cookie Setup (Cross-Domain Railway Fix)
const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';

  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 Days
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  };

  res.cookie('token', token, cookieOptions);
};

module.exports = {
  generateToken,
  setTokenCookie,
};