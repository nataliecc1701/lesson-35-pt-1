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
            industries[idx].companies.push(r.comp_code)
        }
        return res.json({industries})
    }
    catch (e) {
        return next(e)
    }
})


module.exports = router