const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
   {
      username: {
         type: String,
         required: true,
         index: { unique: true }
      },
      email: {
         type: String,
         required: true,
         index: { unique: true }
      },
      password: {
         type: String,
         required: true,
      },
      avatar: {
         type: String
      }
   },
   {
      // Присваиваем поля createdAt и updatedAt с типом Date
      timestamp: true
   }
);

const User = new mongoose.model('User', UserSchema);
module.exports = User;