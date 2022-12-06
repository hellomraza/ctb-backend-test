require("dotenv").config();
const { Neo4jGraphQL } = require("@neo4j/graphql");
const { ApolloServer } = require("apollo-server");
const { Neo4jGraphQLAuthJWTPlugin } = require("@neo4j/graphql-plugin-auth");
const resolvers = require("./resolvers");
const typeDefs = require("./typedefs");
const { ogm, driver } = require("./neo4j");

const neo4jGraphQL = new Neo4jGraphQL({
  typeDefs,
  driver,
  resolvers,
  plugins: {
    auth: new Neo4jGraphQLAuthJWTPlugin({ secret: process.env.JWT_SECRET }),
  },
});

Promise.all([neo4jGraphQL.getSchema(), ogm.init()]).then(([schema]) => {
  const server = new ApolloServer({
    playground: true,
    introspection: true,
    schema,
    cache: "bounded",
    persistedQueries: false,
    context: ({ req }) => ({ req }),
  });
  server
    .listen({ port: 4001 })
    .then(({ url }) => console.log(`🚀 Server ready at ${url}`));
});
