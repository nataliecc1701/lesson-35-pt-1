const express = require("express")
const ExpressError = require("../expressError")
const db = require("../db")

router = new express.Router()

router.get("/", async (req, res, next) => {
    try {
        const results = await db.query(
            `SELECT * FROM industries
            LEFT JOIN companies_industries ON ind_code = code`);
        // return res.json(results.rows)
        const industries = []
        for (const r of results.rows) {
            ind = { code: r.code, industry: r.industry, companies: []};
            
            // check to see if ind is in our industries array
            let idx = -1;
            for (let i=0; i<industries.length; i++) {
                if (industries[i].code == ind.code) {
                    idx = i
                    break
                }
            }
            // add it if it isn't
            if (idx === -1) {
                idx = industries.length;
                industries.push(ind);
            }
            
            // add the company to the industries array
            if (r.comp_code) industries[idx].companies.push(r.comp_code)
        }
        return res.json({industries})
    }
    catch (e) {
        return next(e)
    }
})

router.post("/", async (req, res, next) => {
    if (req.body.code && req.body.industry) {
        try {
            const results = await db.query(
                `INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING *`,
                [req.body.code, req.body.industry]
            )
            return res.status(201).json({added : results.rows[0]});
        }
        catch (e) {
            return next(e)
        } 
    }
    else {
        const e = new ExpressError("Need code, industry to add industry")
        return next(e)
    }
})

router.post("/:code", async (req, res, next) => {
    if (req.body.comp_code) {
        try {
            const result = await db.query(
                `INSERT INTO companies_industries (comp_code, ind_code)
                VALUES ($1, $2) RETURNING *`,
                [req.body.comp_code, req.params.code]
            )
            return res.status(201).json({added : result.rows[0]})
        }
        catch (e) {
            return next(e)
        }
    }
    else {
        const e = new ExpressError("Need comp_code to associate with industry")
        return next(e)
    }
})


module.exports = router