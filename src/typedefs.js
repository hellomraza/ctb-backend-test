const { gql } = require("apollo-server");

const typeDefs = gql`
  type User {
    # id: ID! @id
    email: String! @id(autogenerate: false, unique: true)
    fullName: String!
    gotra: String!
    gender: String @default(value: "male")
    childrens: [User!]! @relationship(type: "CHILDREN", direction: OUT)
    parents: User @relationship(type: "CHILDREN", direction: IN)
    password: String!
    createdAt: DateTime @timestamp(operations: [CREATE])
    updatedAt: DateTime @timestamp(operations: [UPDATE])
    lastModified: DateTime @timestamp
  }
  extend type User
    @auth(
      rules: [
        {
          isAuthenticated: true
          operations: [UPDATE, DELETE, CONNECT, DISCONNECT]
          where: { email: { _eq: "$jwt.sub" } }
        }
      ]
    )

  input UserInput {
    email: String!
    password: String!
    fullName: String!
    gender: String!
    gotra: String!
  }

  input SigniInInput {
    email: String!
    password: String!
  }

  type Query {
    getAllFamilies: [User!]!
      @cypher(
        statement: """
        MATCH (u:User)
        WHERE NOT (u)<-[:CHILDREN]-()
        MATCH (u)-[:CHILDREN*]->(c:User)
        RETURN u ORDER BY c.lenght ASC
        """
      )
    searchUser: [User!]!
      @cypher(
        statement: """
                CALL db.index.fulltext.queryNodes("searchUsers","fullName:(ayes*)") YIELD node, score
        WITH node, score
        RETURN node
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
    addChildren(input: UserInput!): Response!
      @cypher(
        statement: """
        MATCH (n:User)
        WHERE n.email = $input.email
        CREATE (n)-[:CHILDREN]->(u:User {email: $input.email, password: $input.password, fullName: $input.fullName, gotra: $input.gotra})
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

// type TopNode {
//   topNodeName: User
//     @cypher(
//       statement: """
//       MATCH (this) <-[:CHILDREN*]-(top)
//       WHERE NOT (top) <-[:CHILDREN]-()
//       RETURN top
//       """
//     )
//   topNodeDistance: Int
//     @cypher(
//       statement: """
//       MATCH (this)<-[:CHILDREN*1..]-(parents)
//       RETURN count(parents)
//       """
//     )
// }

// input UserInput {
//   name: String!
//   email: String!
//   password: String!
//   surname: String!
// }

// type Query {
//   user: User
//     @cypher(statement: "MATCH (u:User { id: $auth.jwt.sub }) RETURN u")
//     @auth(rules: [{ isAuthenticated: true }])
//   getSiblings(id: ID!): [User!]!
//     @cypher(
//       statement: """
//       MATCH (this {id:$id} )<-[:CHILDREN]-(parent)-[:CHILDREN]->(siblings)
//       WHERE NOT siblings.id = $id
//       RETURN siblings
//       """

// @cypher(
//   # return jwt token
//   statement: """
//   MATCH (u:User { email: $email, password: $password })
//   RETURN { token: apoc.create.jwt({ id: u.id, email:u.email}, "SECRET") }
//   """
// )
// createUser(input: UserInput!): User
// login(email: String!, password: String!): Token
//  @cypher(
//   # return jwt token
//   statement: """
//   MATCH (u:User { email: $email, password: $password })

// addParentAndChild(parentId: ID!, childId: ID!): User
//       @auth(
//         rules: [
//           {
//             isAuthenticated: true
//             operations: [CREATE, UPDATE]
//             allow: { id: "$auth.jwt.sub" }
//           }
//         ]
//       )
//       @cypher(
//         statement: """
//         MATCH (parent {id: $parentId})
//         MATCH (child {id: $childId})
//         MERGE (parent)-[:CHILDREN]->(child)
//         RETURN parent , child,
//         """
//       )