const jwt = require("jsonwebtoken");

const GlobalController = {
  createToken: ({ email }) => {
    return jwt.sign({ sub: email }, process.env.SECRET);
  },
};

module.exports = GlobalController;
