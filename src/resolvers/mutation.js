const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {
   AuthenticationError,
   ForbiddenError
} = require('apollo-server-express');
const mongoose = require('mongoose');
require('dotenv').config();
//генерирует url аватара на основе емейла пользователя
const gravatar = require('../util/gravatar');


// Provide resolver functions for our schema fields
module.exports = {
   newNote: async (parent, args, { models, user }) => {
      if (!user) {
         throw new AuthenticationError('You must be signed in to create a note');
      }
      return await models.Note.create({
         content: args.content,
         author: mongoose.Types.ObjectId(user.id)
      });
   },
   deleteNote: async (parent, { id }, { models, user }) => {
      if (!user) {
         throw new AuthenticationError('You must be signed in to delete a note');
      }
      //находим заметку
      const note = await models.Note.findById(id);
      //Если владелец заметки и текущий пользователь не совпадают выбрасываем запрет
      if (note && String(note.author) !== user.id) {
         throw new ForbiddenError("You don't have permission to delete the note");
      }
      try {
         await note.remove();
         return true;
      } catch (err) {
         return false;
      }
   },
   updateNote: async (parent, { content, id }, { models, user }) => {
      if (!user) {
         throw new AuthenticationError('You must be signed in to update a note');
      }
      const note = await models.Note.findById(id);
      if (note && String(note.author) !== user.id) {
         throw new ForbiddenError("You don't have permission to update the note");
      }
      return await models.Note.findOneAndUpdate(
         {
            _id: id,
         },
         {
            $set: {
               content
            }
         },
         {
            new: true
         }
      );
   },
   signUp: async (parent, { username, email, password }, { models }) => {
      //Нормализуем емейл
      email = email.trim().toLowerCase();
      //хешируем пароль
      const hashed = await bcrypt.hash(password, 10);
      //создаем url аватара
      const avatar = gravatar(email);
      try {
         const user = await models.User.create({
            username,
            email,
            avatar,
            password: hashed
         });
         //создаем и возвращаем json web token
         return jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      } catch (err) {
         console.log(err);
         throw new Error('Error creating account');
      }
   },
   signIn: async (parent, { username, email, password }, { models }) => {
      if (email) {
         //нормализуем емейл
         email = email.trim().toLowerCase();
      }
      const user = await models.User.findOne(
         {
            $or: [{ email }, { username }]
         });
      //если пользователь не найден выбрасываем ошибку аутентификации
      if (!user) {
         throw new AuthenticationError('Error signing in');
      }
      //если пароли не совпадают выбрасываем ошибку аутентификации
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
         throw new AuthenticationError('Error signing in');
      }
      //создаем и возвращаем json web token
      return jwt.sign({ id: user._id }, process.env.JWT_SECRET);
   },
   toggleFavorite: async (parent, { id }, { models, user }) => {
      if (!user) {
         throw new AuthenticationError();
      }
      //Проверяем, отмечал ли пользователь заметку как избранную
      let noteCheck = await models.Note.findById(id);
      const hasUser = noteCheck.favoritedBy.indexOf(user.id);
      //Если пользователь есть в списке, удаляем его и уменьшаем значение favoriteCount на 1
      if (hasUser >= 0) {
         return await models.Note.findByIdAndUpdate(id,
            {
               $pull: {
                  favoritedBy: mongoose.Types.ObjectId(user.id)
               },
               $inc: {
                  favoriteCount: -1
               }
            },
            {
               //Устанавливаем new true чтобы вернуть обновленный документ
               new: true
            });
      } else {
         //Если пользователя в списке нет, добавляем его туда
         return await models.Note.findByIdAndUpdate(id, {
            $push: {
               favoritedBy: mongoose.Types.ObjectId(user.id)
            },
            $inc: {
               favoriteCount: 1
            }
         },
            {
               new: true
            });
      }
   }
};