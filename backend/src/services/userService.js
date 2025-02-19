const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class UserService {
  generateToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
  }

  async signup(userData) {
    const { email, username, password } = userData;
    
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      throw new Error('Email or username already exists');
    }

    const userCount = await User.countDocuments();
    const isAdmin = userCount === 0;

    const user = new User({ ...userData, isAdmin });
    await user.save();
    
    const token = this.generateToken(user._id);
    const userResponse = user.toObject();
    delete userResponse.password;
    
    return { user: userResponse, token };
  }

  async login(email, password) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user._id);
    const userResponse = user.toObject();
    delete userResponse.password;
    
    return { user: userResponse, token };
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();
    return user;
  }

  async getUserProfile(userId) {
    const user = await User.findById(userId)
      .select('-password');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateUserProfile(userId, updateData) {
    const updates = Object.keys(updateData);
    const allowedUpdates = ['username', 'email'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      throw new Error('Invalid updates');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    updates.forEach(update => user[update] = updateData[update]);
    await user.save();
    return user;
  }
}

module.exports = new UserService(); 