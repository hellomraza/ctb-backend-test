const { Neo4jGraphQL } = require("@neo4j/graphql");
const { ApolloServer } = require("apollo-server");
const resolvers = require("./resolvers");
const typeDefs = require("./typedefs");
const { ogm, driver } = require("./neo4j");

const neo4jGraphQL = new Neo4jGraphQL({ typeDefs, driver, resolvers });

Promise.all([neo4jGraphQL.getSchema(), ogm.init()]).then(([schema]) => {
  const server = new ApolloServer({ schema, context: ({ req }) => ({ req }) });
  server.listen().then(({ url }) => console.log(`🚀 Server ready at ${url}`));
});
