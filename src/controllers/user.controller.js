const User = require("../models/user.model");

// Dashboard greeting: basic profile of whoever owns the token
exports.getMe = (req, res) => {
  const user = User.findById(req.user.userId); // req.user was set by the auth middleware
  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({ id: user.id, name: user.name, email: user.email }); // never send passwordHash
};

// About Me: username, email and bio of the logged-in user
exports.getAboutMe = (req, res) => {
  const user = User.findById(req.user.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({
    username: user.name,
    email: user.email,
    bio: user.bio || "",
    joinedAt: user.createdAt,
  });
};

// Users: every registered user. Public-safe fields only (no emails, no hashes).
exports.listUsers = (req, res) => {
  const users = User.all().map((u) => ({
    id: u.id,
    username: u.name,
    bio: u.bio || "",
    joinedAt: u.createdAt,
    isYou: u.id === req.user.userId,
  }));
  res.json({ count: users.length, users });
};