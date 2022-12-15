const { OGM } = require("@neo4j/graphql-ogm");
const neo4j = require("neo4j-driver");
const typeDefs = require("./typedefs");

const MyDriver = neo4j.driver(
  process.env.AURA_ENDPOINT,
  neo4j.auth.basic(process.env.USERNAME, process.env.PASSWORD)
);

const ogm = new OGM({ typeDefs, driver: MyDriver });
const User = ogm.model("User");

module.exports = { ogm, User, MyDriver };
