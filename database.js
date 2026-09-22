// ---------------------------------------------------------------------------
// Demo "database": a plain JSON array that lives in memory.
//
// Every item is keyed by an `id` field and looks like this:
//   { id: 1, email: "ada@example.com", username: "ada", password: "<salt>:<hash>" }
//
// The array resets whenever the server restarts. That is expected for this demo.
// ---------------------------------------------------------------------------
const users = [];

module.exports = users;
