const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  useremail: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  secret: { type: String },
});

const User = mongoose.model('PHRUser', userSchema);

module.exports = User;
