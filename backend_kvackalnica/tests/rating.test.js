/**
 * Test: PATCH /api/projects/:id/difficulty
 */

const request = require("supertest");
const app = require("../app");

// ⬇️ MOCK verifyToken → vedno vstavi user_id = 999
jest.mock("../middleware/auth", () => {
  return (req, res, next) => {
    req.user = { id: 999 };
    next();
  };
});

// ⬇️ MOCK pool.query → simuliramo projekt v bazi
jest.mock("../db", () => {
  return {
    query: jest.fn((sql, params) => {
      // Če se posodablja rating:
      if (sql.includes("UPDATE projects SET difficulty_rating")) {
        return Promise.resolve({
          rows: [{ id: params[1], difficulty_rating: params[0] }],
          rowCount: 1
        });
      }

      return Promise.resolve({ rows: [], rowCount: 0 });
    })
  };
});

describe("Difficulty rating endpoint", () => {
  it("should reject invalid rating (<1 or >5)", async () => {
    const res = await request(app)
      .patch("/api/projects/123/difficulty")
      .send({ difficulty_rating: 10 });

    expect(res.statusCode).toBe(400);
  });

  it("should accept valid rating 1..5", async () => {
    const res = await request(app)
      .patch("/api/projects/123/difficulty")
      .send({ difficulty_rating: 4 });

    expect(res.statusCode).toBe(200);
    expect(res.body.project.difficulty_rating).toBe(4);
  });
});
