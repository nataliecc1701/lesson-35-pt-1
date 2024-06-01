const express = require("express")
const ExpressError = require("../expressError")
const db = require("../db")

router = new express.Router()

router.get("/", async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM companies`)
        return res.json({companies : results.rows})
    }
    catch (e) {
        return next(e)
    }
})

router.get("/:code", async (req, res, next) => {
    try {
        const company = await db.query(`SELECT * FROM companies WHERE code=$1`,
            [req.params.code]);
        if (!company.rows.length) throw new ExpressError("Not Found!", 404);
        const invoices = await db.query(`SELECT * FROM invoices WHERE comp_code = $1`,
            [req.params.code]);
        company.rows[0].invoices = invoices.rows;
        return res.json({company : company.rows[0]});
    }
    catch (e) {
        return next(e)
    }
})

router.post("/", async (req, res, next) => {
    if (req.body && req.body.code && req.body.name && req.body.description) {
        const { code, name, description } = req.body;
        try {
            const results = await db.query(`INSERT INTO companies (code, name, description)
                VALUES ($1, $2, $3) RETURNING *`, [code, name, description]);
            return res.json({added : results.rows[0]})
        }
        catch (e) {
            return next(e)
        }
    }
    else {
        const e = new ExpressError("Need code, name, description to add company", 400)
        return next(e)
    }
})

router.put("/:code", async (req, res, next) => {
    if (req.body && req.body.name && req.body.description) {
        const { name, description } = req.body;
        try {
            const results = await db.query(`UPDATE companies
                SET name = $1, description = $2
                WHERE code = $3 RETURNING *`, [name, description, req.params.code])
            if (!results.rows.length) return next(new ExpressError("Not Found!", 404))
            return res.json({updated : results.rows[0]})
        }
        catch (e) {
            return next(e)
        }
    }
    else {
        const e = new ExpressError("Need name and description to edit company", 400)
        return next(e)
    }
})

router.delete("/:code", async (req, res, next) => {
    try {
        const results = await db.query(`DELETE FROM companies WHERE code=$1`,
            [req.params.code]);
        if (!results.rowCount) throw new ExpressError("Not Found!", 404);
        return res.json({message : "deleted"});
    }
    catch (e) {
        return next(e)
    }
})

module.exports = router