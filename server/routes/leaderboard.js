const router = require("express").Router();
const User   = require("../models/User");

// GET /api/leaderboard  (public)
router.get("/", async (req, res) => {
  try {
    const mode = req.query.mode || "bestWpm"; // bestWpm | avgWpm
    const sortField = ["bestWpm", "avgWpm"].includes(mode) ? mode : "bestWpm";

    const users = await User.find({ totalSessions: { $gt: 0 } })
      .select("username bestWpm avgWpm avgAccuracy totalSessions createdAt")
      .sort({ [sortField]: -1 })
      .limit(25);

    res.json({ leaderboard: users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not fetch leaderboard" });
  }
});

module.exports = router;
