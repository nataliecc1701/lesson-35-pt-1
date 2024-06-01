const express = require("express")
const ExpressError = require("../expressError")
const db = require("../db")

router = new express.Router()

router.get("/", async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM invoices`)
        return res.json({invoices : results.rows})
    }
    catch (e) {
        return next(e)
    }
})

router.get("/:id", async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM invoices WHERE id=$1`,
            [req.params.id]);
        if (!results.rows.length) throw new ExpressError("Not Found!", 404);
        return res.json({invoice : results.rows[0]});
    }
    catch (e) {
        return next(e)
    }
})

router.post("/", async (req, res, next) => {
    if (req.body && req.body.comp_code && req.body.amt) {
        const { comp_code, amt } = req.body;
        try {
            const results = await db.query(`INSERT INTO invoices (comp_code, amt)
                VALUES ($1, $2) RETURNING *`, [comp_code, amt]);
            return res.json({added : results.rows[0]})
        }
        catch (e) {
            return next(e)
        }
    }
    else {
        const e = new ExpressError("Need comp_code and amt to add invoice", 400)
        return next(e)
    }
})

router.put("/:id", async (req, res, next) => {
    if (req.body && req.body.amt) {
        const { amt } = req.body;
        try {
            const results = await db.query(`UPDATE invoices
                SET amt = $1
                WHERE id = $2 RETURNING *`, [amt, req.params.id])
            if (!results.rows.length) return next(new ExpressError("Not Found!", 404))
            return res.json({updated : results.rows[0]})
        }
        catch (e) {
            return next(e)
        }
    }
    else {
        const e = new ExpressError("Need amt to edit invoice", 400)
        return next(e)
    }
})

module.exports = router