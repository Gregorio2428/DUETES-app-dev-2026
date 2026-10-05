const User = require("../models/user.model");

exports.getMe = (req, res) => {
  const user = User.findById(req.user.userId); // req.user was set by the auth middleware
  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({ id: user.id, name: user.name, email: user.email }); // never send passwordHash
};
