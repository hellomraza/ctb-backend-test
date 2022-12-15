const { gql } = require("apollo-server");
const userType = require("./usertype");
const contactType = require("./contactType");
const familyQuerys = require("./familyQuerys");

const typeDefs = gql`
  type User

  type FamilyResp
  type Response

  input UserInput
  input SigniInInput
  input ContactInput

  type Query
  type Mutation
`;

module.exports = [typeDefs, userType, familyQuerys, contactType];
