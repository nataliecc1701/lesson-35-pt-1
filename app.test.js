process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("./app")
const db = require("./db")

let testCo;
let testInv;
let testInd;
const secondCo = {
    code: "secCo",
    name: "Second Company",
    description: "Another fake company for testing"
}
const secondInv = {
    comp_code: "testco",
    amt: 217
}

beforeEach(async () => {
    company = await db.query(
        `INSERT INTO companies (code, name, description)
        VALUES ('testco', 'Test Company', 'A fake company inserted into the database during automated tests')
        RETURNING code, name, description`
    );
    invoice = await db.query(
        `INSERT INTO invoices (comp_code, amt)
        VALUES ('testco', 314)
        RETURNING *`
    );
    industry = await db.query(
        `INSERT INTO industries (code, industry)
        VALUES ('tst', 'Test Industry')
        RETURNING *`
    )
    await db.query(
        `INSERT INTO companies_industries (comp_code, ind_code)
        VALUES ('testco', 'tst')`
    )
    testCo = company.rows[0];
    testInv = invoice.rows[0];
    testInd = industry.rows[0];
})

afterEach(async () => {
    // empty the database tables
    q1 = db.query(`DELETE FROM companies`)
    q2 = db.query(`DELETE FROM invoices`)
    q3 = db.query(`DELETE FROM industries`)
    q4 = db.query(`DELETE FROM companies_industries`)
    await Promise.all([q1, q2, q3, q4])
})

afterAll(async () => {
    await db.end();
})

describe("GET /companies", () => {
    test("gets a list of companies", async () => {
        const resp = await request(app).get("/companies");
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({companies: [testCo]});
    })
})

describe("POST /companies", () => {
    test("posts a company", async () => {
        // does the post request respond correctly
        const resp = await request(app).post("/companies").send(secondCo);
        expect(resp.statusCode).toBe(201);
        expect(resp.body).toEqual({added: secondCo});
        
        // does the companies list update
        const resp2 = await request(app).get("/companies");
        expect(resp2.statusCode).toBe(200);
        expect(resp2.body).toEqual({companies: [testCo, secondCo]});
    })
})

describe("GET /companies/:code", () => {
    test("Gets a single company and its invoices", async () => {
        const resp = await request(app).get(`/companies/${testCo.code}`);
        // can't test for total equality because of formatting issues between what pg returns
        // and what res.json returns but we can test every individual parameter
        expect(resp.statusCode).toBe(200);
        expect(resp.body.company.name).toEqual(testCo.name);
        expect(resp.body.company.code).toEqual(testCo.code);
        expect(resp.body.company.description).toEqual(testCo.description);
        expect(resp.body.company.invoices.length).toEqual(1);
        expect(resp.body.company.invoices[0].amt).toEqual(testInv.amt);
        expect(resp.body.company.industries).toEqual(expect.any(Array));
        expect(resp.body.company.industries[0]).toEqual(testInd.industry)
    })
    test("404s on nonexistent companies", async () => {
        const resp = await request(app).get(`/companies/fakeco`);
        expect(resp.statusCode).toBe(404);
        expect(resp.body).toEqual({message: "Not Found!"});
    })
})

describe("PUT /companies/code", () => {
    test("Changes a single company", async () => {
        testCo.name = "TestCorp";
        testCo.description = "New Fake Testing Corporation, now powered by AI"
        const resp = await request(app).put(`/companies/${testCo.code}`).send(testCo);
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({updated: testCo});
        
        // does the companies list update
        const resp2 = await request(app).get("/companies");
        expect(resp2.statusCode).toBe(200);
        expect(resp2.body).toEqual({companies: [testCo]});
    })
    test("404s on nonexistent companies", async () => {
        const resp = await request(app).put(`/companies/${secondCo.code}`).send(secondCo);
        expect(resp.statusCode).toBe(404);
        expect(resp.body).toEqual({message: "Not Found!"});
    })
})

describe("DELETE /companies/code", () => {
    test("Deletes a company", async () => {
        const resp = await request(app).delete(`/companies/${testCo.code}`);
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({message : "deleted"});
        
        // does the companies list update
        const resp2 = await request(app).get("/companies");
        expect(resp2.statusCode).toBe(200);
        expect(resp2.body).toEqual({companies: []});
    })
    test("404s on nonexistent companies", async () => {
        const resp = await request(app).delete(`/companies/fakeco`);
        expect(resp.statusCode).toBe(404);
        expect(resp.body).toEqual({message: "Not Found!"});
    })
})

describe("GET /invoices/", () => {
    test("gets a list of invoices", async () => {
        const resp = await request(app).get("/invoices");
        expect(resp.statusCode).toBe(200);
        // add_dates don't format correctly so we check that it's there then remove them
        expect(resp.body).toEqual({invoices: expect.any(Array)});
        testInv.add_date = undefined;
        resp.body.invoices[0].add_date = undefined;
        expect(resp.body.invoices[0]);
    })
})

describe("POST /invoices", () => {
    test("adds a new invoice", async () => {
        // does the post request respond correctly
        const resp = await request(app).post("/invoices").send(secondInv);
        expect(resp.statusCode).toBe(201);
        expect(resp.body).toEqual({added: expect.any(Object)});
        expect(resp.body.added.comp_code).toEqual(secondInv.comp_code);
        expect(resp.body.added.amt).toEqual(secondInv.amt);
        
        // does the invoices list update
        const resp2 = await request(app).get("/invoices");
        expect(resp2.statusCode).toBe(200);
        expect(resp2.body).toEqual({invoices: expect.any(Array)});
        expect(resp2.body.invoices.length).toEqual(2)
    })
})

describe("GET /invoices/:id", () => {
    test("Gets a single invoice", async () => {
        const resp = await request(app).get(`/invoices/${testInv.id}`);
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toHaveProperty("invoice")
        // add_dates don't format correctly so we remove them now that we know they're there
        testInv.add_date = undefined;
        resp.body.invoice.add_date = undefined;
        expect(resp.body.invoice).toEqual(testInv);
    })
    test("404s on nonexistent companies", async () => {
        const resp = await request(app).get(`/invoices/-1`);
        expect(resp.statusCode).toBe(404);
        expect(resp.body).toEqual({message: "Not Found!"});
    })
})

describe("PUT /invoices/id", () => {
    test("Changes amount on an invoice", async () => {
        testInv.amt = 167;
        testInv.paid = false;
        const resp = await request(app).put(`/invoices/${testInv.id}`).send(testInv);
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toHaveProperty("updated");
        // add_dates don't format correctly so we remove them now that we know they're there
        testInv.add_date = undefined;
        resp.body.updated.add_date = undefined;
        expect(resp.body.updated).toEqual(testInv);
        
        // does the invoices list update
        const resp2 = await request(app).get("/invoices");
        expect(resp2.statusCode).toBe(200);
        // strip the add dates
        expect(resp2.body).toEqual({invoices: expect.any(Array)});
        testInv.add_date = undefined;
        resp2.body.invoices[0].add_date = undefined;
        expect(resp2.body.invoices[0]);
    })
    test("Changes paid status on an invoice", async () => {
        testInv.paid = true;
        const today = new Date();
        const resp = await request(app).put(`/invoices/${testInv.id}`).send(testInv);
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toHaveProperty("updated");
        expect(resp.body).toHaveProperty("updated.paid_date");
        expect(resp.body.updated.paid_date.year).toEqual(today.year);
        expect(resp.body.updated.paid_date.month).toEqual(today.month);
        expect(resp.body.updated.paid_date.day).toEqual(today.day);
        
        // strip the dates and compare
        resp.body.updated.paid_date = null;
        testInv.paid_date = null;
        resp.body.updated.add_date = null;
        testInv.add_date = null;
        expect(resp.body).toEqual({updated : testInv})
    })
    test("404s on nonexistent companies", async () => {
        testInv.paid = false;
        const resp = await request(app).put(`/invoices/-1`).send(testInv);
        expect(resp.statusCode).toBe(404);
        expect(resp.body).toEqual({message: "Not Found!"});
    })
})

describe("DELETE /invoices/id", () => {
    test("Deletes an invoice", async () => {
        const resp = await request(app).delete(`/invoices/${testInv.id}`);
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({message : "deleted"});
        
        // does the companies list update
        const resp2 = await request(app).get("/invoices");
        expect(resp2.statusCode).toBe(200);
        expect(resp2.body).toEqual({invoices: []});
    })
    test("404s on nonexistent invoices", async () => {
        const resp = await request(app).delete(`/invoices/-1`);
        expect(resp.statusCode).toBe(404);
        expect(resp.body).toEqual({message: "Not Found!"});
    })
})