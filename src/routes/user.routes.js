const router = require("express").Router();
const auth = require("../middleware/auth");
const { getMe, getAboutMe, listUsers } = require("../controllers/user.controller");

router.use(auth); // every route below needs a valid, unexpired token

router.get("/me", getMe);            // GET /api/users/me        (dashboard greeting)
router.get("/about-me", getAboutMe); // GET /api/users/about-me  (About Me page)
router.get("/", listUsers);          // GET /api/users           (Users page)

module.exports = router;