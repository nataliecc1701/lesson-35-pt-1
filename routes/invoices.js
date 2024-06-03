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
            return res.status(201).json({added : results.rows[0]})
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
    if (req.body && "amt" in req.body && "paid" in req.body) {
        const { amt, paid } = req.body;
        try {
            const old_invoice = await db.query(`SELECT * FROM invoices WHERE id = $1`,
                [req.params.id])
            if (!old_invoice.rows.length) return next(new ExpressError("Not Found!", 404));
            if (old_invoice.paid == req.body.paid) {
                const results = await db.query(`UPDATE invoices
                SET amt = $1
                WHERE id = $2 RETURNING *`, [amt, req.params.id])
            }
            // Since we're changing the payment status, we change the datestamp on it
            // null if it's unpaid, otherwise today
            let paid_date = req.body.paid ? new Date() : null;
            
            const results = await db.query(`UPDATE invoices
                SET amt = $1, paid = $2, paid_date = $3
                WHERE id = $4 RETURNING *`, [amt, req.body.paid, paid_date, req.params.id])
            return res.json({updated : results.rows[0]})
        }
        catch (e) {
            return next(e)
        }
    }
    else {
        const e = new ExpressError("Need amt and paid (bool) to edit invoice", 400)
        return next(e)
    }
})

router.delete("/:id", async (req, res, next) => {
    try {
        const results = await db.query(`DELETE FROM invoices WHERE id=$1`,
            [req.params.id]);
        if (!results.rowCount) throw new ExpressError("Not Found!", 404);
        return res.json({message : "deleted"});
    }
    catch (e) {
        return next(e)
    }
})

module.exports = router