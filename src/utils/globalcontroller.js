const jwt = require("jsonwebtoken");

const GlobalController = {
  createToken: ({ email }) => {
    return jwt.sign({ sub: email }, process.env.JWT_SECRET);
  },
};

module.exports = GlobalController;
