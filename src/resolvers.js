const { User } = require("./neo4j");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { ApolloError } = require("apollo-server");

const signUp = async (_, { input }) => {
  try {
    const { email, password, fullName, gotra } = input;
    const encPassword = await bcrypt.hash(password, 10);
    const [user] = await User.find({ where: { email } });
    if (!user) new ApolloError("User already exists", "BAD_REQUEST");
    await User.create({
      input: [{ password: encPassword, fullName, gotra, email }],
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
    const token = jwt.sign({ sub: email }, "SECRET", { algorithm: "HS256" });
    return { status: 200, message: "User logged in successfully", token };
  } catch (error) {
    console.log(error);
    return new ApolloError(error.message, 500);
  }
};

const resolvers = { Mutation: { signUp, signIn } };

module.exports = resolvers;
