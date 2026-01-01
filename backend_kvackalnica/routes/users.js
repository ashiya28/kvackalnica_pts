const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const verifyToken = require("../middleware/auth");

const router = express.Router();


router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ error: "Vsa polja so obvezna!" });

  try {
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0)
      return res.status(400).json({ error: "Uporabnik s tem emailom že obstaja!" });

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: "Uporabnik uspešno registriran ✅" });
  } catch (err) {
    console.error("Napaka pri registraciji:", err);
    res.status(500).json({ error: "Napaka pri registraciji" });
  }
});




router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email in geslo sta obvezna!" });

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0)
      return res.status(400).json({ error: "Uporabnik s tem emailom ne obstaja!" });

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ error: "Napačno geslo!" });

 
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';
    if (!process.env.JWT_SECRET) {
      console.warn('⚠️  JWT_SECRET ni nastavljen v .env datoteki! Uporabljam fallback ključ.');
    } else {
      console.log('✅ JWT_SECRET uspešno naložen iz .env datoteke');
    }
    
    try {
      const token = jwt.sign(
        { id: user.id, email: user.email, username: user.username },
        jwtSecret,
        { expiresIn: "2h" }
      );

      res.json({ 
        message: "Prijava uspešna ✅", 
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
    } catch (jwtError) {
      console.error("Napaka pri generiranju JWT tokena:", jwtError);
      return res.status(500).json({ error: "Napaka pri generiranju tokena" });
    }
  } catch (err) {
    console.error("Napaka pri prijavi:", err);
    res.status(500).json({ error: "Napaka pri prijavi" });
  }
});


router.post("/change-password", verifyToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id; // pridobljen iz JWT tokena

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "Staro in novo geslo sta obvezna!" });
  }


  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Uporabnik ni najden!" });
    }

    const user = result.rows[0];

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return res.status(401).json({ error: "Staro geslo ni pravilno!" });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ error: "Novo geslo mora biti drugačno od starega!" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE users SET password = $1 WHERE id = $2",
      [hashedNewPassword, userId]
    );

    res.json({ message: "Geslo uspešno spremenjeno ✅" });
  } catch (err) {
    console.error("Napaka pri spreminjanju gesla:", err);
    res.status(500).json({ error: "Napaka pri spreminjanju gesla" });
  }
});

router.get("/profile", verifyToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        username: req.user.username
      }
    });
  } catch (err) {
    console.error("Napaka pri pridobivanju profila:", err);
    res.status(500).json({ error: "Napaka pri pridobivanju profila" });
  }
});

module.exports = router;
