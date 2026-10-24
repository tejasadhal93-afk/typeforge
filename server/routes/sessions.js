const router  = require("express").Router();
const authMw  = require("../middleware/auth");
const Session = require("../models/Session");
const User    = require("../models/User");

// POST /api/sessions  (protected)
router.post("/", authMw, async (req, res) => {
  try {
    const { mode, label, drillId, wpm, rawWpm, accuracy, duration, errors, correctChars, keyErrors, streak } = req.body;

    const session = await Session.create({
      userId: req.userId, mode, label, drillId,
      wpm, rawWpm, accuracy, duration, errors, correctChars, keyErrors, streak
    });

    // Update user stats
    const userSessions = await Session.find({ userId: req.userId });
    const wpms = userSessions.map(s => s.wpm);
    const avgWpm = Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length);
    const bestWpm = Math.max(...wpms);
    const accs = userSessions.map(s => s.accuracy);
    const avgAccuracy = Math.round((accs.reduce((a, b) => a + b, 0) / accs.length) * 10) / 10;
    const totalTimeMinutes = Math.round(userSessions.reduce((a, s) => a + s.duration, 0) / 60 * 10) / 10;

    await User.findByIdAndUpdate(req.userId, {
      bestWpm, avgWpm, avgAccuracy,
      totalSessions: userSessions.length,
      totalTimeMinutes
    });

    res.status(201).json({ session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not save session" });
  }
});

// GET /api/sessions  (protected, latest 100)
router.get("/", authMw, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.userId })
      .sort({ date: -1 }).limit(100);
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch sessions" });
  }
});

module.exports = router;
