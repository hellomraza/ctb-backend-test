const { gql } = require("apollo-server");

const typeDefs = gql`
  type User {
    # id: ID! @id
    email: String! @id(autogenerate: false, unique: true)
    name: String!
    familyName: String
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
  extend type User
    @auth(rules: [{ isAuthenticated: true }, { allow: { email: "$jwt.sub" } }])

  input UserInput {
    email: String!
    password: String!
    name: String!
    gender: String!
    familyName: String!
  }

  input SigniInInput {
    email: String!
    password: String!
  }

  type FamilyResp {
    noOfMembers: Int!
      @cypher(
        statement: """
        MATCH (this)-[:CHILDREN*]->(n:User)
        RETURN COUNT(n)
        """
      )
    familyName: String!
    name: String!
    email: String!
  }

  type Query {
    getAllFamilies: [FamilyResp]
      @cypher(
        statement: """
        MATCH (n:User)
        WHERE NOT (n) <-[:CHILDREN]-()
        MATCH (n)-[:CHILDREN*]->(m:User)
        RETURN n, COUNT(m) AS noOfMembers ORDER BY noOfMembers DESC
        """
      )
      @auth(rules: [{ isAuthenticated: true }])
    getFamily(email: String!): User
      @cypher(
        statement: """
        MATCH (n:User)
        WHERE n.email = $email
        RETURN n
        """
      )
      @auth(rules: [{ isAuthenticated: true }])
    searchUser(query: String, limit: Int, page: Int): [User]
      @cypher(
        statement: """
        CALL db.index.fulltext.queryNodes('searchUser', $query) YIELD node, score
        WITH node, score
        RETURN node
        ORDER BY toUpper(node.name) ASC
        SKIP coalesce(coalesce($limit ,30) * ($page - 1), 0)
        LIMIT coalesce($limit, 30)
        """
      )
    # @auth(rules: [{ isAuthenticated: true }])
    searchFamily(query: String, limit: Int, page: Int): [FamilyResp!]!
      @cypher(
        statement: """
        CALL db.index.fulltext.queryNodes('searchUser', $query) YIELD node, score
        WITH node, score
        WHERE NOT (node) <-[:CHILDREN]-()
        RETURN node
        ORDER BY node.name ASC
        SKIP coalesce(coalesce($limit ,30) * ($page - 1), 0)
        LIMIT coalesce($limit, 30)
        """
      )
      @auth(rules: [{ isAuthenticated: true }])
  }

  type Response {
    status: Int!
    message: String!
    payload: User
    token: String
  }

  type Mutation {
    signUp(input: UserInput!): Response!
    signIn(input: SigniInInput!): Response!
    googleAuth(idToken: String!): Response!
    addChildren(input: UserInput!): Response!
    addRelationship(email: String!, childrenEmail: String!): Response!
      @cypher(
        statement: """
        MATCH (n:User), (m:User)
        WHERE n.email = $email AND m.email = $childrenEmail
        MERGE (n)-[:CHILDREN]->(m)
        RETURN n
        """
      )
      @auth(rules: [{ isAuthenticated: true }])
    removeRelationship(parentEmail: String!, childrenEmail: String!): Response!
      @cypher(
        statement: """
        MATCH (n:User)-[r:CHILDREN]->(m:User)
        WHERE n.email = $parentEmail AND m.email = $childrenEmail
        DELETE r
        RETURN n
        """
      )
      @auth(rules: [{ isAuthenticated: true }])
    # @auth(
    #   rules: [
    #     {
    #       isAuthenticated: true
    #       operations: [CREATE, UPDATE, DELETE, CONNECT, DISCONNECT]
    #       where: { email: { _eq: "$jwt.sub" } }
    #     }
    #   ]
    # )
  }
`;

module.exports = typeDefs;
