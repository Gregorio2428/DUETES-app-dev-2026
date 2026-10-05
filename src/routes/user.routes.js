const router = require("express").Router();
const auth = require("../middleware/auth");
const { getMe } = require("../controllers/user.controller");

router.get("/me", auth, getMe); // GET /api/users/me  (protected)

module.exports = router;
