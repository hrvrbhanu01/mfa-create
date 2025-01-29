const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

const generateSecret = () => {
    return speakeasy.generateSecret({ length: 20, name: 'PHR', issuer: 'PHR' });
  };

const verifyOTP = (secret, otp) => {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: otp,
      window: 0,
    });
  };

const generateQRCode = (url) => {
    return qrcode.toDataURL(url);
  };

module.exports = { generateSecret, verifyOTP, generateQRCode };