const jwt = require("jsonwebtoken");
const jwtSecret = require("..");
jwtSecret;
console.log(jwtSecret);

const requireAuth = (req, res, next) => {
  const token = req.cookies.token; // graabbing the token from where we saved it

  // we have to check if it exists or not & valid

  if (token) {
    // if we have a token we have to verify it
    jwt.verify(token, jwtSecret, (err, decodedToken) => {
      if (err) {
        res.redirect("/login");
      } else {
        console.log(decodedToken);
        next();
      }
    });
  } else {
    res.redirect("/login");
  }
};

module.exports = {requireAuth}
