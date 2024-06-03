process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("./app")
const db = require("./db")

let testCo;
let testInv;

beforeEach(async () => {
    company = await db.query(
        `INSERT INTO companies (code, name, description)
        VALUES ('testco', 'Test Company', 'A fake company inserted into the database during automated tests')
        RETURNING code, name, description`
    );
    invoice = await db.query(
        `INSERT INTO invoices (comp_code, amt)
        VALUES ('testco', 314)
        RETURNING comp_code, amt`
    );
    testCo = company.rows[0];
    testInv = invoice.rows[0];
})

afterEach(async () => {
    // empty the database tables
    q1 = db.query(`DELETE FROM companies`)
    q2 = db.query(`DELETE FROM invoices`)
    await Promise.all([q1, q2])
})

afterAll(async () => {
    await db.end();
})

describe("GET /companies", () => {
    test("gets a list of companies", async () => {
        const resp = await request(app).get("/companies");
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({companies: [testCo]})
    })
})