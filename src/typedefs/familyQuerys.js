const { gql } = require("apollo-server");

const FamilyQuerys = gql`
  extend type FamilyResp {
    noOfMembers: Int
    familyName: String
    name: String
    email: String
    id: ID!
  }
  extend type Query {
    getAllFamilies: [FamilyResp]
      @cypher(
        statement: """
        MATCH (n:User)
        WHERE NOT (n) <-[:CHILDREN]-()
        MATCH (n)-[:CHILDREN*]->(m:User)
        RETURN n, COUNT(m) AS noOfMembers ORDER BY noOfMembers DESC
        """
      )
    getFamily(email: String!): User
      @cypher(
        statement: """
        MATCH (n:User)
        WHERE n.email = $email
        RETURN n
        """
      )
    searchFamily(query: String, limit: Int, page: Int): [FamilyResp!]!
      @cypher(
        statement: """
        CALL db.index.fulltext.queryNodes('searchUser', $query+'*') YIELD node, score
        WHERE NOT (node) <-[:CHILDREN]-()
        RETURN node
        UNION
        CALL db.index.fulltext.queryNodes('searchUser', $query+'~') YIELD node, score
        WHERE NOT (node) <-[:CHILDREN]-()
        RETURN node
        ORDER BY node.name ASC
        SKIP coalesce(coalesce($limit ,30) * ($page - 1), 0)
        LIMIT coalesce($limit, 30)
        """
      )
  }
`;

module.exports = FamilyQuerys;
