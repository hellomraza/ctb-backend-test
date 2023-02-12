const { gql } = require("apollo-server");

const userType = gql`
  extend type User {
    _id: ID! @id
    email: String
    name: String
    familyName: String
    number: String
    gender: String @default(value: "male")
    childrens: [User!]! @relationship(type: "CHILDREN", direction: OUT)
    parents: User @relationship(type: "CHILDREN", direction: IN)
    password: String
    picture: String
    DOB: String
    alive: Boolean @default(value: true)
    anonymous: Boolean
    createdAt: DateTime @timestamp(operations: [CREATE])
    updatedAt: DateTime @timestamp(operations: [UPDATE])
    lastModified: DateTime @timestamp
  }

  extend input UserInput {
    email: String!
    password: String!
    name: String!
    gender: String!
    familyName: String!
  }
  extend input SigniInInput {
    email: String!
    password: String!
  }

  extend type Query {
    searchUser(query: String, limit: Int = 30, page: Int = 1): [User]
      @cypher(
        statement: """
        CALL db.index.fulltext.queryNodes('searchUser',$query +'*') YIELD node, score
        RETURN node
        ORDER BY toUpper(node.name) ASC
        SKIP $limit * ($page - 1)
        LIMIT $limit
        """
      )
  }

  extend type Response {
    status: Int!
    message: String!
    payload: User
    token: String
  }

  extend type Mutation {
    signUp(input: UserInput!): Response!
    signIn(input: SigniInInput!): Response!
    googleAuth(idToken: String!): Response!
    addRelationship(email: String!, childrenEmail: String!): Response!
      @cypher(
        statement: """
        MATCH (n:User), (m:User)
        WHERE n.email = $email AND m.email = $childrenEmail
        MERGE (n)-[:CHILDREN]->(m)
        RETURN n
        """
      )
    removeRelationship(parentEmail: String!, childrenEmail: String!): Response!
      @cypher(
        statement: """
        MATCH (n:User)-[r:CHILDREN]->(m:User)
        WHERE n.email = $parentEmail AND m.email = $childrenEmail
        DELETE r
        RETURN n
        """
      )
  }
`;

module.exports = userType;
