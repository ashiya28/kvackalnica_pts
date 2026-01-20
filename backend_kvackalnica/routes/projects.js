const express = require("express");
const { randomUUID } = require("crypto");
const verifyToken = require("../middleware/auth");
const pool = require("../db");
const upload = require("../middleware/upload");
const { emitUserEvent } = require("../kafka/producer");

const router = express.Router();

function buildEvent(activity_type, user_id, entity_id = "", metadata = {}) {
  return {
    event_id: randomUUID(),
    user_id,
    activity_type,
    event_time: Date.now(),
    day: new Date().toISOString().split("T")[0],
    entity_id: entity_id || "",
    metadata_json: JSON.stringify(metadata)
  };
}


// 🟢 Dodaj nov projekt
router.post("/add", verifyToken, async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.id; // pridobljen iz JWT tokena

  if (!name || !description) {
    return res.status(400).json({ error: "Ime in opis projekta sta obvezna!" });
  }

  try {
    await pool.query(
      "INSERT INTO projects (user_id, name, description, status) VALUES ($1, $2, $3, $4)",
      [userId, name, description, 'in_progress']
    );
    await emitUserEvent(buildEvent("CREATE_PROJECT", userId));
    res.status(201).json({ message: "Projekt uspešno dodan ✅" });
  } catch (err) {
    console.error("Napaka pri dodajanju projekta:", err);
    res.status(500).json({ error: "Napaka pri dodajanju projekta." });
  }
});

// 🟡 Pridobi vse projekte uporabnika
router.get("/myprojects", verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      "SELECT * FROM projects WHERE user_id = $1",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Napaka pri pridobivanju projektov:", err);
    res.status(500).json({ error: "Napaka pri pridobivanju projektov." });
  }
});

// 📸 Upload multiple images for a project
router.post('/:id/images', verifyToken, upload.array('images', 10), async (req, res) => {
  const projectId = req.params.id;
  const userId = req.user.id;

  try {
    // Verify project belongs to user
    const projectResult = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Projekt ni najden ali ni tvoj.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Nobena slika ni bila naložena.' });
    }

    // enforce max 10 images per project
    const countRes = await pool.query('SELECT COUNT(*)::int AS c FROM images WHERE project_id = $1', [projectId]);
    const existing = countRes.rows[0].c;
    if (existing + req.files.length > 10) {
      return res.status(400).json({ error: `Projekt lahko ima največ 10 slik (trenutno ${existing}).` });
    }

    // Insert image records and collect inserted rows
    const inserted = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const order = existing + i;
      const q = `INSERT INTO images (project_id, filename, file_path, file_size, mime_type, upload_order)
                 VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, filename, file_path, file_size, mime_type, upload_order`;
      const vals = [projectId, file.originalname, file.path, file.size, file.mimetype, order];
      const r = await pool.query(q, vals);
      inserted.push(r.rows[0]);
    }

    res.status(201).json({ 
      message: `${inserted.length} slik uspešno naloženih!`,
      images: inserted
    });

    await emitUserEvent(buildEvent("UPLOAD_IMAGE", userId));

  } catch (err) {
    console.error('Napaka pri nalaganju slik:', err);
    res.status(500).json({ error: 'Napaka pri nalaganju slik.' });
  }
});

// 📸 Get all images for a project
router.get('/:id/images', verifyToken, async (req, res) => {
  const projectId = req.params.id;
  const userId = req.user.id;

  try {
    // Verify project belongs to user
    const projectResult = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Projekt ni najden ali ni tvoj.' });
    }

    // Get images
    const imagesResult = await pool.query(
      'SELECT * FROM images WHERE project_id = $1 ORDER BY upload_order, created_at',
      [projectId]
    );

    res.json(imagesResult.rows);

  } catch (err) {
    console.error('Napaka pri pridobivanju slik:', err);
    res.status(500).json({ error: 'Napaka pri pridobivanju slik.' });
  }
});

// 🗑️ Delete a specific image
router.delete('/images/:imageId', verifyToken, async (req, res) => {
  const imageId = req.params.imageId;
  const userId = req.user.id;

  try {
    // Get image info and verify ownership
    const imageResult = await pool.query(
      `SELECT i.*, p.user_id 
       FROM images i 
       JOIN projects p ON i.project_id = p.id 
       WHERE i.id = $1 AND p.user_id = $2`,
      [imageId, userId]
    );

    if (imageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Slika ni najdena ali ni tvoja.' });
    }

    const image = imageResult.rows[0];

    // Delete file from filesystem
    const fs = require('fs');
    if (fs.existsSync(image.file_path)) {
      fs.unlinkSync(image.file_path);
    }

    // Delete from database
    await pool.query('DELETE FROM images WHERE id = $1', [imageId]);

    res.json({ message: 'Slika uspešno izbrisana.' });

  } catch (err) {
    console.error('Napaka pri brisanju slike:', err);
    res.status(500).json({ error: 'Napaka pri brisanju slike.' });
  }
});

// 🔍 Pridobi posamezen projekt (mora biti PO specificnih rutah)
router.get("/:id", verifyToken, async (req, res) => {
  const projectId = req.params.id;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      "SELECT * FROM projects WHERE id = $1 AND user_id = $2",
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Projekt ni najden ali ni tvoj." });
    }

    res.json(result.rows[0]);
    await emitUserEvent(buildEvent("VIEW_PROJECT", userId));
  } catch (err) {
    console.error("Napaka pri pridobivanju projekta:", err);
    res.status(500).json({ error: "Napaka pri pridobivanju projekta." });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  const projectId = req.params.id;
  const userId = req.user.id;

  try {
    await pool.query("DELETE FROM projects WHERE id = $1 AND user_id = $2", [
      projectId,
      userId,
    ]);
    res.json({ message: "Projekt uspešno izbrisan." });
    await emitUserEvent(buildEvent("DELETE_PROJECT", userId));
  } catch (err) {
    console.error("Napaka pri brisanju projekta:", err);
    res.status(500).json({ error: "Napaka pri brisanju projekta." });
  }
});

// Posodobi projekt
router.put('/:id', verifyToken, async (req, res) => {
  const { name, description, status } = req.body;
  const userId = req.user.id; // iz JWT tokena
  const projectId = req.params.id;

  if (!name && !description && !status) {
    return res.status(400).json({ error: "Vsaj eno polje mora biti posodobljeno." });
  }

  try {
    // Convert boolean status to string if provided
    let statusValue = status;
    if (status === true) {
      statusValue = 'finished';
    } else if (status === false) {
      statusValue = 'in_progress';
    }

    // First get the current project to check its current status
    const currentProject = await pool.query(
      "SELECT status FROM projects WHERE id = $1 AND user_id = $2",
      [projectId, userId]
    );

    if (currentProject.rowCount === 0) {
      return res.status(404).json({ error: "Projekt ni najden ali ni tvoj." });
    }

    const currentStatus = currentProject.rows[0].status;
    let finishedAtValue = null;

    // Set finished_at based on status change
    if (statusValue === 'finished' && currentStatus !== 'finished') {
      finishedAtValue = new Date();
    } else if (statusValue === 'in_progress') {
      finishedAtValue = null;
    }

    const result = await pool.query(
      `UPDATE projects 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           finished_at = COALESCE($4, finished_at)
       WHERE id = $5 AND user_id = $6
       RETURNING *;`,
      [name, description, statusValue, finishedAtValue, projectId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Projekt ni najden ali ni tvoj." });
    }

    res.json({ message: "Projekt uspešno posodobljen.", updated: result.rows[0] });
    await emitUserEvent(buildEvent("UPDATE_PROJECT", userId));
  } catch (err) {
    console.error("Napaka pri posodabljanju projekta:", err);
    res.status(500).json({ error: "Napaka pri posodabljanju projekta." });
  }
});

// PATCH /api/projects/:id/difficulty
router.patch('/:id/difficulty', verifyToken, async (req, res) => {
  const projectId = req.params.id;
  const userId = req.user && req.user.id; // verifyToken naj nastavi req.user
  const { difficulty_rating } = req.body;
  const d = parseInt(difficulty_rating, 10);
  if (!d || d < 1 || d > 5) return res.status(400).json({ error: 'difficulty_rating must be integer 1..5' });

  try {
    const q = `UPDATE projects SET difficulty_rating = $1 WHERE id = $2 AND user_id = $3 RETURNING *`;
    const { rows } = await pool.query(q, [d, projectId, userId]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Project not found or not owned' });
    return res.json({ project: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;
