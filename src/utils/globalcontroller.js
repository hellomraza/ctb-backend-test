const jwt = require("jsonwebtoken");

const GlobalController = {
  createToken: ({ id }) => {
    console.log(id);
    return jwt.sign({ sub: id }, process.env.JWT_SECRET);
  },
  verifYToken: (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
  },
};

module.exports = GlobalController;
