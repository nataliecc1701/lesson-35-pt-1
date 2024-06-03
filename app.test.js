process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("./app")
const db = require("./db")

beforeEach(async () => {
    company = db.query(`INSERT INTO companies (code, name, description) VALUES ($1 $2 $3)`,
    ['testco', 'Test Company', 'A fake company inserted into the database during automated tests'])
    invoice = db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2)`
    ['testco', 314])
    await Promise.all([company, invoice])
})

afterEach(async () => {
    // empty the database tables
    q1 = db.query(`DELETE FROM companies`)
    q2 = db.query(`DELETE FROM invoices`)
    await Promise.all([q1, q2])
})