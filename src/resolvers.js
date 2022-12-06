const { User } = require("./neo4j");
const bcrypt = require("bcrypt");
const { ApolloError } = require("apollo-server");
const { OAuth2Client } = require("google-auth-library");
const GlobalController = require("./utils/globalcontroller");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const audience = process.env.GOOGLE_CLIENT_ID;

const signUp = async (_, { input }) => {
  try {
    const { email, password, name, gotra } = input;
    const encPassword = await bcrypt.hash(password, 10);
    const [user] = await User.find({ where: { email } });
    if (!user) new ApolloError("User already exists", "BAD_REQUEST");
    await User.create({
      input: [{ password: encPassword, name, gotra, email }],
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
    if (!user) new ApolloError("User not found", 404);
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) new ApolloError("Password is incorrect", 401);
    const token = GlobalController.createToken({ email });
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
    const response = await User.find({ where: { email } });
    if (response.length === 0) {
      const user = { name, email, family_name, picture };
      await User.create({ input: [user] });
      const token = GlobalController.createToken({ email });
      return {
        status: 200,
        message: "User logged in successfully",
        token,
        payload: user,
      };
    } else {
      const [user] = response;
      await User.update({ where: { email }, update: { picture } });
      const token = GlobalController.createToken({ email });
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

// const getAllFamilies = async (_, _, context) => {
//   try {
//     const query = `
//   MATCH (u:User)
//   RETURN u
// `;
//     const users = await context.driver
//       .session()
//       .run(query)
//       .then((response) =>
//         response.records.map((record) => record.get("u").properties)
//       );

//     return users;
//   } catch (error) {
//     console.log(error);
//     return new ApolloError(error.message, 500);
//   }
// };

const resolvers = {
  Mutation: { signUp, signIn, googleAuth },
};

module.exports = resolvers;
