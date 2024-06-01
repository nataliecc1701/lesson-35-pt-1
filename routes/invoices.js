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
        const results = await db.query(`SELECT * FROM id WHERE id=$1`,
            [req.params.id]);
        if (!results.rows.length) throw new ExpressError("Not Found!", 404);
        return res.json({invoice : results.rows[0]});
    }
    catch (e) {
        return next(e)
    }
})

module.exports = router