
// Provide resolver functions for our schema fields
module.exports = {
   notes: async (parent, args, { models }) => {
      return await models.Note.find().limit(100);
   },
   note: async (parent, args, { models }) => {
      return await models.Note.findById(args.id);
   },
   noteFeed: async (parent, { cursor }, { models }) => {
      //Жестко кодируем лимит в 10 элементов
      const limit = 10;
      //Устанавливаем значение false по умолчанию для hasNextPage
      let hasNextPage = false;
      //Если курсор передан не будет то по умолчанию запрос будет пуст, из БД будут извлечены последние заметки
      let cursorQuery = {};
      //если курсор задан запрос будет искать заметки меньше этого курсора со значением ObjectID
      if (cursor) {
         cursorQuery = { _id: { $lt: cursor } };
      }
      //находим лимитированные заметки в БД
      let notes = await models.Note.find(cursorQuery).sort({ _id: -1 }).limit(limit + 1);
      // если превышает лимит устанавливаем hasNextPage true и обрезаем по лимиту
      if (notes.length > limit) {
         hasNextPage = true;
         notes = notes.slice(0, -1);
      }
      // новым курсором будет ID Mongo объекта последнего элемента массива списка
      const newCursor = notes[notes.length - 1]._id;
      return {
         notes,
         cursor: newCursor,
         hasNextPage
      };
   },
   user: async (parent, { username }, { models }) => {
      return await models.User.findOne({ username });
   },
   users: async (parent, args, { models }) => {
      return await models.User.find({});
   },
   me: async (parent, args, { models, user }) => {
      return await models.User.findById(user.id);
   }
};