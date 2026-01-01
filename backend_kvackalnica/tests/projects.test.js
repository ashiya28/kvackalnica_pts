const request = require("supertest");
const app = require("../app");
const db = require("../db");

// mock DB
jest.mock("../db");

// mock authentication – user id = 1
jest.mock("../middleware/auth", () => {
  return (req, res, next) => {
    req.user = { id: 1, email: "test@test.com", username: "tester" };
    next();
  };
});

// disable console.error noise during tests
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.clearAllMocks();
});


// POST /api/projects/add
test("doda nov projekt", async () => {
  db.query.mockResolvedValueOnce({ rows: [] });

  const res = await request(app)
    .post("/api/projects/add")
    .send({ name: "Projekt 1", description: "Opis" });

  expect(res.statusCode).toBe(201);
  expect(res.body.message).toMatch(/uspešno dodan/i);
});

test("ne doda projekta brez imena ali opisa", async () => {
  const res = await request(app)
    .post("/api/projects/add")
    .send({ name: "Projekt 1" });

  expect(res.statusCode).toBe(400);
});

test("napaka v bazi pri dodajanju projekta vrne 500", async () => {
  db.query.mockRejectedValueOnce(new Error("DB FAIL"));

  const res = await request(app)
    .post("/api/projects/add")
    .send({ name: "Projekt 1", description: "Opis" });

  expect(res.statusCode).toBe(500);
});


// GET /api/projects/myprojects
test("vrne uporabnikove projekte", async () => {
  db.query.mockResolvedValueOnce({
    rows: [{ id: 1, name: "P1", description: "X" }]
  });

  const res = await request(app).get("/api/projects/myprojects");

  expect(res.statusCode).toBe(200);
  expect(res.body.length).toBe(1);
});

test("vrne 500 ob DB napaki pri myprojects", async () => {
  db.query.mockRejectedValueOnce(new Error("DB ERR"));

  const res = await request(app).get("/api/projects/myprojects");

  expect(res.statusCode).toBe(500);
});


// GET /api/projects/:id
test("vrne posamezen projekt", async () => {
  db.query.mockResolvedValueOnce({
    rows: [{ id: 1, user_id: 1, name: "Test" }]
  });

  const res = await request(app).get("/api/projects/1");

  expect(res.statusCode).toBe(200);
  expect(res.body.id).toBe(1);
});

test("vrne 404 če projekt ne obstaja ali ni uporabnikov", async () => {
  db.query.mockResolvedValueOnce({ rows: [] });

  const res = await request(app).get("/api/projects/999");

  expect(res.statusCode).toBe(404);
});


// DELETE /api/projects/:id
test("izbriše projekt", async () => {
  db.query.mockResolvedValueOnce({}); 

  const res = await request(app).delete("/api/projects/1");

  expect(res.statusCode).toBe(200);
  expect(res.body.message).toMatch(/izbrisan/i);
});

test("napaka v DB pri brisanju vrne 500", async () => {
  db.query.mockRejectedValueOnce(new Error("DB ERR"));

  const res = await request(app).delete("/api/projects/1");

  expect(res.statusCode).toBe(500);
});



// PUT /api/projects/:id
test("posodobi projekt", async () => {
  db.query
    .mockResolvedValueOnce({ rows: [{ status: "in_progress" }] }) // current project
    .mockResolvedValueOnce({
      rows: [{ id: 1, name: "New", description: "X", status: "finished" }]
    });

  const res = await request(app)
    .put("/api/projects/1")
    .send({ name: "New", status: true });

  expect(res.statusCode).toBe(200);
  expect(res.body.updated.status).toBe("finished");
});

test("vrne 404 če projekt ne obstaja pri update", async () => {
  db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

  const res = await request(app)
    .put("/api/projects/999")
    .send({ name: "New" });

  expect(res.statusCode).toBe(404);
});


test("vrne 400 če ni nobenega polja za posodobitev", async () => {
  const res = await request(app).put("/api/projects/1").send({});

  expect(res.statusCode).toBe(400);
});


// PATCH /api/projects/:id/difficulty
test("posodobi difficulty rating", async () => {
  db.query.mockResolvedValueOnce({
    rows: [{ id: 1, difficulty_rating: 4 }]
  });

  const res = await request(app)
    .patch("/api/projects/1/difficulty")
    .send({ difficulty_rating: 4 });

  expect(res.statusCode).toBe(200);
  expect(res.body.project.difficulty_rating).toBe(4);
});

test("vrne 400 če rating ni 1–5", async () => {
  const res = await request(app)
    .patch("/api/projects/1/difficulty")
    .send({ difficulty_rating: 99 });

  expect(res.statusCode).toBe(400);
});

test("vrne 404 če projekt ne obstaja pri difficulty", async () => {
  db.query.mockResolvedValueOnce({ rows: [] });

  const res = await request(app)
    .patch("/api/projects/1/difficulty")
    .send({ difficulty_rating: 3 });

  expect(res.statusCode).toBe(404);
});
