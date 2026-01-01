module.exports = function mockAuth(userId = 1) {
  return (req, res, next) => {
    req.user = {
      id: userId,
      username: "TestUser",
      email: "test@example.com"
    };
    next();
  };
};
