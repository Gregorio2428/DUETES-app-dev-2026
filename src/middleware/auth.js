const jwt = require("jsonwebtoken");

// Protects a route: no valid, unexpired token -> 401. Otherwise req.user = token payload.
module.exports = function auth(req, res, next) {
  const header = req.headers.authorization; // expected: "Bearer <token>"
  const token = header && header.split(" ")[1];

  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // checks signature + expiry (expiresIn)
    next();
  } catch (err) {
    // Tell the client *why*, so the UI can say "session expired" instead of a vague error
    const expired = err.name === "TokenExpiredError";
    res.status(401).json({ error: expired ? "Token expired, please log in again" : "Invalid token" });
  }
};