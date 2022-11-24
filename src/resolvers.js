const { User } = require("./neo4j");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");

const resolvers = {
  Mutation: {
    createUser: async (_, args, context) => {
      const { name, email, password, surname } = args.input;

      if (!name || !email || !password || !surname)
        throw new Error("Missing required fields");

      const [existing] = await User.find({ where: { email } });

      if (existing) throw new Error("User already exists");

      const newUser = await User.create({
        input: [{ id: uuidv4(), ...args.input }],
      });

      return newUser.users[0];
    },

    login: async (_, args, context) => {
      const { email, password } = args;

      if (!email || !password) throw new Error("Missing required fields");

      const [existing] = await User.find({ where: { email } });

      if (!existing) throw new Error("User not found");

      if (existing.password !== password)
        throw new Error("Wrong password or email");

      const token = jwt.sign(
        { id: existing.id, email: existing.email },
        "SECRET"
      );

      return { token };
    },
  },
};

module.exports = resolvers;
