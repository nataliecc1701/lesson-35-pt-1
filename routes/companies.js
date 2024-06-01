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
        const results = await db.query(`SELECT * FROM companies WHERE code=$1`,
            [req.params.code]);
        if (!results.rows.length) throw new ExpressError("Not Found!", 404);
        return res.json({company : results.rows[0]});
    }
    catch (e) {
        return next(e)
    }
})

router.post("/", async (req, res, next) => {
    let newComp;
    if (req.body && req.body.code && req.body.name && req.body.description) {
        const { code, name, description } = req.body
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

module.exports = router