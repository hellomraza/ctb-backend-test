const { User } = require("./neo4j");
const bcrypt = require("bcrypt");
const { ApolloError } = require("apollo-server");
const { OAuth2Client } = require("google-auth-library");
const GlobalController = require("./utils/globalcontroller");
const { ogm, MyDriver } = require("./neo4j");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const audience = process.env.GOOGLE_CLIENT_ID;

const signUp = async (_, { input }) => {
  try {
    const { email, password, name, familyName } = input;
    const encPassword = await bcrypt.hash(password, 10);
    const [user] = await User.find({ where: { email } });
    if (!user) new ApolloError("User already exists", "BAD_REQUEST");
    await User.create({
      input: [{ password: encPassword, name, familyName, email }],
    });
    return { status: 200, message: "User created successfully" };
  } catch (error) {
    console.log(error);
    return new ApolloError(error.message, 500);
  }
};

const signIn = async (_, { input }) => {
  try {
    const { email, password } = input;
    const [user] = await User.find({ where: { email } });
    if (!user) new ApolloError("User does not exist", 401);
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) new ApolloError("Password is incorrect", 401);
    const token = GlobalController.createToken({ id: user._id });
    return { status: 200, message: "User logged in successfully", token };
  } catch (error) {
    console.log(error);
    return new ApolloError(error.message, 500);
  }
};

const googleAuth = async (_, { idToken }) => {
  try {
    const { payload } = await client.verifyIdToken({ idToken, audience });
    if (!payload.email_verified)
      return new ApolloError("Email not verified", 401);
    const { email, name, family_name, picture } = payload;
    console.log(payload);
    const response = await User.find({ where: { email } });

    if (response.length === 0) {
      const user = { name, email, familyName: family_name, picture };
      const { users } = await User.create({ input: [user] });
      if (users.length === 0) new ApolloError("Something went wrong", 500);
      const token = GlobalController.createToken({ id: users[0]._id });
      return {
        status: 200,
        message: "User logged in successfully",
        token,
        payload: users[0],
      };
    } else {
      const [user] = response;
      await User.update({ where: { email }, update: { picture } });
      const token = GlobalController.createToken({ id: user._id });
      return {
        status: 200,
        message: "User logged in successfully",
        token,
        payload: user,
      };
    }
  } catch (error) {
    console.log(error);
    return new ApolloError(error.message, 500);
  }
};

const syncContacts = async (_, { contacts = [] }, ctx) => {
  try {
    const id = ctx?.jwt?.sub;
    const myConctacts = contacts.map((contact) => {
      let fixNumber = contact.number.replace(/[^0-9]/g, "");
      if (fixNumber.length === 10) fixNumber = `91${fixNumber}`;
      return { name: contact.name, number: fixNumber, email: contact.email };
    });
    const cypher = `
    MATCH (me:User {_id: $id})
    UNWIND $contacts as contact
    MERGE (knows:User{number:contact.number}) 
    SET 
    knows.name = CASE WHEN knows.name IS NOT NULL AND trim(knows.name) = '' THEN contact.name ELSE knows.name END,
    knows.email = CASE WHEN knows.email IS NOT NULL AND trim(knows.email) = '' THEN contact.email ELSE knows.email END,
    knows._id = coalesce(knows._id, randomUUID()),
    knows.anonymous = coalesce(knows.anonymous, true)
    with me, knows
    MERGE (me)-[:KNOWS]->(knows)
    RETURN knows
    `;
    const session = MyDriver.session();
    const result = await session.run(cypher, { id, contacts: myConctacts });
    session.close();
    return result.records.map((record) => record._fields[0].properties);
  } catch (error) {
    console.log(error);
    return new ApolloError(error.message, 500);
  }
};

module.exports = { Mutation: { signUp, signIn, googleAuth, syncContacts } };
