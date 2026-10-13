const auth = require("../services/auth");

const register = async (req, res) => {
  const result = await auth.register(req.body);

  res.status(201).json(result);
};

const login = async (req, res) => {
  const result = await auth.login(req.body);

  res.status(200).json(result);
};

const getUserById = async (req, res) => {
  const result = await auth.getUserbyId(req.params.userId);

  res.status(200).json(result);
};

const me = async (req, res) => {
  const result = await auth.me(req.user.id);

  return res.status(200).json(result);
};

module.exports = {
  register,
  login,
  getUserById,
  me,
};
