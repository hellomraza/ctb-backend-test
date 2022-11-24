const { gql } = require("apollo-server");

const typeDefs = gql`
  type TopNode {
    topNodeName: User
      @cypher(
        statement: """
        MATCH (this) <-[:CHILDREN*]-(top)
        WHERE NOT (top) <-[:CHILDREN]-()
        RETURN top
        """
      )
    topNodeDistance: Int
      @cypher(
        statement: """
        MATCH (this)<-[:CHILDREN*1..]-(parents)
        RETURN count(parents)
        """
      )
  }
  type User {
    id: ID
    name: String!
    surname: String!
    email: String!
    password: String! @private
    childrens: [User!]! @relationship(type: "CHILDREN", direction: OUT)
    parents: User @relationship(type: "CHILDREN", direction: IN)
    topNode: TopNode
  }
  input UserInput {
    name: String!
    email: String!
    password: String!
    surname: String!
  }
  type Query {
    user(email: String!, password: String!): User
    getSiblings(id: ID!): [User!]!
      @cypher(
        statement: """
        MATCH (this {id:$id} )<-[:CHILDREN]-(parent)-[:CHILDREN]->(siblings)
        WHERE NOT siblings.id = $id
        RETURN siblings
        """
      )
  }
  type Token {
    token: String!
  }
  type Mutation {
    createUser(input: UserInput!): User
    login(email: String!, password: String!): Token
    addParentAndChild(parentId: ID!, childId: ID!): User
      @cypher(
        statement: """
        MATCH (parent:User {id: $parentId})
        MATCH (child:User {id: $childId})
        MERGE (parent)-[:CHILDREN]->(child)
        RETURN parent,
        """
      )
  }
`;

module.exports = typeDefs;
