const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  // 1️⃣ Preveri, ali ima uporabnik header "Authorization"
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: "Dostop zavrnjen: ni tokena." });
  }

  // 2️⃣ Preveri veljavnost tokena
  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded; // shranimo podatke iz tokena (id, email, username)
    next(); // pojdi naprej do prave funkcije
  } catch (err) {
    console.error("Napaka pri preverjanju tokena:", err);
    return res.status(403).json({ error: "Token ni veljaven ali je potekel." });
  }
}

module.exports = verifyToken;
