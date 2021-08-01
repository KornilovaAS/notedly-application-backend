const mongoose = require('mongoose');

// определяем схему БД
const noteSchema = new mongoose.Schema(
   {
      content: {
         type: String,
         required: true
      },
      author: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
         required: true
      },
      favoriteCount: {
         type: Number,
         default: 0
      },
      favoritedBy: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
         }
      ]
   },
   {
      timestamps: true
   }
);

//определяем модель 'Note' со схемой 
const Note = mongoose.model('Note', noteSchema);

module.exports = Note;