require("dotenv").config();
const { Neo4jGraphQL } = require("@neo4j/graphql");
const { ApolloServer, AuthenticationError } = require("apollo-server");
const { Neo4jGraphQLAuthJWTPlugin } = require("@neo4j/graphql-plugin-auth");
const resolvers = require("./resolvers");
const typeDefs = require("./typedefs");
const { ogm, MyDriver } = require("./neo4j");
const GlobalController = require("./utils/globalcontroller");

const neo4jGraphQL = new Neo4jGraphQL({
  typeDefs,
  driver: MyDriver,
  resolvers,
  plugins: {
    auth: new Neo4jGraphQLAuthJWTPlugin({
      secret: process.env.JWT_SECRET,
    }),
  },
});

Promise.all([neo4jGraphQL.getSchema(), ogm.init()]).then(([schema]) => {
  const server = new ApolloServer({
    playground: true,
    introspection: true,
    schema,
    cache: "bounded",
    persistedQueries: false,
    context: ({ req }) => {
      try {
        const openOperations = [
          "signUp",
          "signIn",
          "googleAuth",
          "IntrospectionQuery",
        ];
        const operationName = req?.body?.operationName || null;
        if (openOperations.includes(operationName)) return { req };
        const authHeader = req?.headers?.authorization || null;
        if (!authHeader)
          throw new AuthenticationError("You must be logged in to do this");
        const token = authHeader.split(" ")[1] || null;
        if (!token)
          throw new AuthenticationError("You must be logged in to do this");
        const payload = GlobalController.verifYToken(token);
        console.log(payload);
        return { req };
      } catch (error) {
        throw new AuthenticationError("You must be logged in to do this");
      }
    },
  });
  server
    .listen({ port: 4001 })
    .then(({ url }) => console.log(`🚀 Server ready at ${url}`));
});
