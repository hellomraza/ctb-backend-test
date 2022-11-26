const { gql } = require("apollo-server");

const typeDefs = gql`
  type User {
    # id: ID! @id
    email: String! @id(autogenerate: false, unique: true)
    fullName: String!
    gotra: String!
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
    gotra: String!
  }

  input SigniInInput {
    email: String!
    password: String!
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
    addParentAndChildren(parent: ID!, children: ID!): Response!
      @cypher(
        statement: """
        MATCH (parent:User {id: $parent}), (children:User {id: $children})
        MERGE (parent)-[:CHILDREN]->(children)
        RETURN parent, children
        """
      )
      @auth(
        rules: [
          {
            isAuthenticated: true
            operations: [CREATE, UPDATE, DELETE, CONNECT, DISCONNECT]
            where: { email: { _eq: "$jwt.sub" } }
          }
        ]
      )
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
