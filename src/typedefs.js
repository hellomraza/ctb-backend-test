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

  type getAllFamiliesResponse {
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
    getAllFamilies: [getAllFamiliesResponse!]!
      @cypher(
        statement: """
        MATCH (n:User)
        WHERE NOT (n) <-[:CHILDREN]-()
        MATCH (n)-[:CHILDREN*]->(m:User)
        RETURN n, COUNT(m) AS noOfMembers ORDER BY noOfMembers DESC
        """
      )
    # @auth(rules: [{ isAuthenticated: true }])
    getFamily(email: String!): User
      @cypher(
        statement: """
        MATCH (n:User)
        WHERE n.email = $email
        RETURN n
        """
      )
      @auth(rules: [{ isAuthenticated: true }])
    searchUser(query: String, limit: Int, skip: Int): [User!]!
      @cypher(
        statement: """
        CALL db.index.fulltext.queryNodes('searchUser', $query) YIELD node, score
        WITH node, score
        RETURN node
        ORDER BY node.name ASC
        SKIP coalesce(toInteger($skip), 0)
        LIMIT coalesce(toInteger($limit), 30)
        """
      )
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
      @cypher(
        statement: """
        MATCH (n:User)
        WHERE n.email = $this.email
        CREATE (n)-[:CHILDREN]->(u:User {input})
        RETURN u
        """
      )
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
