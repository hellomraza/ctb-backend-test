const { Neo4jGraphQL } = require("@neo4j/graphql");
const { ApolloServer, gql } = require("apollo-server");
const neo4j = require("neo4j-driver");

const AURA_ENDPOINT = "neo4j+s://ae77c18b.databases.neo4j.io";
const USERNAME = "neo4j";
const PASSWORD = "LKS4WNWpGRarv3QybXjVcYxom8i_JceOBbg84attpS4";

const driver = neo4j.driver(
  AURA_ENDPOINT,
  neo4j.auth.basic(USERNAME, PASSWORD)
);

const typeDefs = gql`
  type FamilyMem {
    id: ID!
    name: String!
    surname: String!
    sonOf: FamilyMem @relationship(type: "SON", direction: IN)
    fatherOf: [FamilyMem!]! @relationship(type: "FATHER", direction: IN)
  }
`;

const neo4jGraphQL = new Neo4jGraphQL({ typeDefs, driver });

neo4jGraphQL.getSchema().then((schema) => {
  const server = new ApolloServer({
    schema,
    context: { driverConfig: { database: "neo4j" } },
  });
  server.listen().then(({ url }) => console.log(` server ready at ${url}`));
});
