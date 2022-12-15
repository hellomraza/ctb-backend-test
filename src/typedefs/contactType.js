const { gql } = require("apollo-server");

const contactType = gql`
  extend input ContactInput {
    name: String
    number: String!
    email: String
    isSynced: Boolean
    _id: String
  }

  extend type Mutation {
    syncContacts(contacts: [ContactInput]!): Boolean
  }
`;

module.exports = contactType;
