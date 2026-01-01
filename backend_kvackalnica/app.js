const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const { randomUUID } = require("crypto");
const { emitTestEvent } = require("./kafka/producer");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const userRouter = require("./routes/users");
const projectRouter = require("./routes/projects");

app.use("/api/users", userRouter);
app.use("/api/projects", projectRouter);

app.post("/debug/emit-event", async (req, res) => {
  try {
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const eventId = randomUUID();

    const event = {
      event_id: eventId,
      user_id: req.body?.user_id || "debug-user",
      activity_type: req.body?.activity_type || "PROJECT_VIEWED",
      event_time: now,
      day: today
    };

    await emitTestEvent(event);
    console.log("DEBUG sent event:", event);

    res.status(200).json({ ok: true, sent: event });
  } catch (e) {
    console.error("DEBUG emit-event failed:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = app;
