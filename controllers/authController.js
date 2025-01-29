const bcrypt = require('bcrypt');
const { sendEmail } = require('../services/emailServices');
const { generateSecret, verifyOTP, generateQRCode } = require('../services/mfaServices');
const User = require('../models/User');
const qrcode = require('qrcode-terminal');
const { totp } = require('otplib');


const signup = async (req, res) => {
    const { username, useremail, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ username }, { useremail }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const secret = generateSecret();

    const newUser = new User({
      username,
      useremail,
      password: hashedPassword,
      secret: secret.base32,
    });

    try {
      await newUser.save();

      const url = `otpauth://totp/PHR:${username}?secret=${secret.base32}&issuer=PHR`;

      qrcode.generate(url, { small: true }, (qrCode) => {
        console.log("Scan this QR code using your authenticator app:");
        console.log(qrCode);
      });

      const qrCodeData = await generateQRCode(url);
      await sendEmail(useremail, 'Your MFA QR Code', `Scan this QR code with your Authenticator app: ${qrCodeData}`);

      return res.status(201).json({ message: 'User created. Please scan the QR code to set up MFA.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error creating user or sending email' });
    }
  };

const login = async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (!user) {
    return res.status(400).json({ message: 'Invalid username or email' });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return res.status(400).json({ message: 'Invalid password' });
  }

  if (!user.secret) {
    return res.status(200).json({ message: 'No MFA set up. You are logged in.' });
  }
  return res.status(200).json({ message: 'Please enter your OTP' });
};

const verify = async (req, res) => {
  const { username, otp } = req.body;

  const user = await User.findOne({ username });

  if (!user) {
    return res.status(400).json({ message: 'Invalid user' });
  }

  const isVerified = verifyOTP(user.secret, otp);

  if (isVerified) {
    return res.status(200).json({ message: 'OTP verified successfully. You are logged in.' });
  } else {
    return res.status(400).json({ message: 'Invalid OTP' });
  }
};

module.exports = { signup, login, verify };
