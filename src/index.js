const helmet = require('helmet');
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const depthLimit = require('graphql-depth-limit');
const { createComplexityLimitRule } = require('graphql-validation-complexity');
require('dotenv').config();
//Импортируем локальные модули
const db = require('./db');
const models = require('./models');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');

// Run the server on a port specified in our .env file or port 4000
const port = process.env.PORT || 4000;
const DB_HOST = process.env.DB_HOST;

const app = express();
app.use(helmet());
app.use(cors());

db.connect(DB_HOST);

//Получаем информацию пользователя из JWT
const getUser = token => {
   if (token) {
      try {
         //Возвращаем информацию пользовтаеля из токена
         return jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
         new Error('Session invalid');
      }

   }
};

// Apollo Server setup
const server = new ApolloServer({
   typeDefs,
   resolvers,
   validationRules: [depthLimit(5), createComplexityLimitRule(1000)],
   context: ({ req }) => {
      //получаем токен пользователя из заголовков
      const token = req.headers.authorization;
      //Пытаемся извлечь пользователя с таким токеном
      const user = getUser(token);
      //Временно будем выводить инфу в консоль
      console.log(user);
      //Добавление моделей БД в context 
      return { models, user };
   }
});



// Apply the Apollo GraphQL middleware and set the path to /api
server.applyMiddleware({ app, path: '/api' });

app.listen({ port }, () =>
   console.log(
      `GraphQL Server running at http://localhost:${port}${server.graphqlPath}`
   )
);





