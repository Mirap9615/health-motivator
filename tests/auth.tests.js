const request = require("supertest");
const app = require("../server/index.cjs");

describe("Authentication API", () => {
    let userCookie;

    beforeAll(async () => {
        await request(app)
            .post("/api/auth/register")
            .send({
                email: "nyutest@gmail.com",
                name: "user1337",
                password: "w17b75ny0%1n6"
            });
    });

    afterAll(async () => {
        // TODO: add cleanup 
    });

    it("should register a new user", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send({
                email: "nyut@gmail.com",
                name: "user1338",
                password: "w17b75ny0%1n7!"
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("message", "User registered successfully");
    });

    it("should not register a user with an already existing email", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send({
                email: "nyut@gmail.com",
                name: "DuplicateUser",
                password: "shouldnotpass"
            });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("error", "Email already in use");
    });

    it("should not register a user with an invalid email format", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send({
                email: "g@i.com",
                name: "InvalidEmail",
                password: "validpasswo!r!d"
            });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("error", "Invalid email format");
    });

    it("should log in a user with correct credentials", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({
                email: "nyut@gmail.com",
                password: "w17b75ny0%1n7!"
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("message", "Login successful");

        userCookie = res.headers["set-cookie"];
    });

    it("should not log in a user with incorrect credentials", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({
                email: "nyut@gmail.com",
                password: "wrongpass"
            });

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty("error", "Invalid credentials");
    });

    it("should not log in a non-existent user", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({
                email: "notexist@example.com",
                password: "w17b75ny0%1n7!"
            });

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty("error", "Invalid credentials");
    });

    it("should allow access to a protected route when authenticated", async () => {
        const res = await request(app)
            .get("/api/user")
            .set("Cookie", userCookie);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("email", "testuser@example.com");
    });

    it("should not allow access to a protected route without authentication", async () => {
        const res = await request(app)
            .get("/api/user");

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty("message", "Unauthorized");
    });

    it("should not allow access after logout", async () => {
        await request(app).post("/api/auth/logout").set("Cookie", userCookie);

        const protectedRes = await request(app)
            .get("/api/user")
            .set("Cookie", userCookie);

        expect(protectedRes.statusCode).toBe(401);
    });

    it("should maintain session across requests", async () => {
        const loginRes = await request(app)
            .post("/api/auth/login")
            .send({
                email: "nyut@gmail.com",
                password: "w17b75ny0%1n7!"
            });

        const sessionCookie = loginRes.headers["set-cookie"];

        const protectedRes = await request(app)
            .get("/api/user")
            .set("Cookie", sessionCookie);

        expect(protectedRes.statusCode).toBe(200);
    });

    it("should expire session after a set duration", async () => {
        jest.useFakeTimers();

        const loginRes = await request(app)
            .post("/api/auth/login")
            .send({
                email: "nyut@gmail.com",
                password: "w17b75ny0%1n7!"
            });

        const sessionCookie = loginRes.headers["set-cookie"];

        jest.advanceTimersByTime(1000 * 60 * 60 * 24 + 1); 

        const protectedRes = await request(app)
            .get("/api/user")
            .set("Cookie", sessionCookie);

        expect(protectedRes.statusCode).toBe(401);

        jest.useRealTimers(); 
    });

    it("should reset a user's password", async () => {
        const res = await request(app)
            .post("/api/auth/reset-password")
            .send({
                email: "nyut@gmail.com",
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("message", "Password reset link sent");
    });

    it("should not reset password for a non-existent user", async () => {
        const res = await request(app)
            .post("/api/auth/reset-password")
            .send({
                email: "ne@gmail.com"
            });

        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty("error", "User not found");
    });
});