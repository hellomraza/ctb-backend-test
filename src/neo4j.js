const { OGM } = require("@neo4j/graphql-ogm");
const neo4j = require("neo4j-driver");
const typeDefs = require("./typedefs");
const { AURA_ENDPOINT, USERNAME, PASSWORD } = require("./utils/constant");

const driver = neo4j.driver(
  AURA_ENDPOINT,
  neo4j.auth.basic(USERNAME, PASSWORD)
);
const ogm = new OGM({ typeDefs, driver });
const User = ogm.model("User");

module.exports = { ogm, User, driver };
