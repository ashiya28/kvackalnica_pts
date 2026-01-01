const request = require("supertest");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = require("../app");
const db = require("../db");

jest.mock("../db"); // mockamo bazo
jest.mock("bcrypt"); // mock hashing
jest.mock("jsonwebtoken"); // mock token generation



test("Registracija uspe (201)", async () => {
    // Email NE obstaja
    db.query
        .mockResolvedValueOnce({ rows: [] }) // SELECT email
        .mockResolvedValueOnce({ rows: [] }); // INSERT

    const res = await request(app)
        .post("/api/users/register")
        .send({
        username: "Ana",
        email: "ana@example.com",
        password: "testpass"
        });

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/registriran/i);
});


test("Registracija zavrne podvojen email (400)", async () => {
    db.query.mockResolvedValueOnce({
        rows: [{ id: 1, email: "ana@example.com" }]
    });

    const res = await request(app)
        .post("/api/users/register")
        .send({
        username: "Ana",
        email: "ana@example.com",
        password: "pass"
        });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/obstaja/i);
});


test("Login zavrne napačno geslo (401)", async () => {
    // DB vrne user
    db.query.mockResolvedValueOnce({
        rows: [{ id: 1, email: "ana@example.com", password: "hashed" }]
    });

    // bcrypt.compare vrne false
    bcrypt.compare.mockResolvedValue(false);

    const res = await request(app)
        .post("/api/users/login")
        .send({
        email: "ana@example.com",
        password: "wrongpass"
        });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain("Napačno geslo");
});


test("Login zavrne neobstoječ email (400)", async () => {
    db.query.mockResolvedValueOnce({
        rows: []  // user ne obstaja
    });

    const res = await request(app)
        .post("/api/users/login")
        .send({
        email: "test@example.com",
        password: "whatever"
        });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ne obstaja/i);
});


test("Login uspe in vrne JWT token (200)", async () => {

    db.query.mockResolvedValueOnce({
        rows: [{
        id: 1,
        username: "Ana",
        email: "ana@example.com",
        password: "hashedPass"
        }]
    });

    bcrypt.compare.mockResolvedValue(true);

    jwt.sign.mockReturnValue("fake-jwt-token");

    const res = await request(app)
        .post("/api/users/login")
        .send({
        email: "ana@example.com",
        password: "correctpass"
        });

    expect(res.status).toBe(200);
    expect(res.body.token).toBe("fake-jwt-token");
    expect(res.body.user.email).toBe("ana@example.com");
});