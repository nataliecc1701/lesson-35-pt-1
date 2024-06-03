/** BizTime express application. */


const express = require("express");
const companiesRoutes = require("./routes/companies.js")
const invoicesRoutes = require("./routes/invoices.js")
const industriesRoutes = require("./routes/industries.js")

const app = express();
const ExpressError = require("./expressError")

app.use(express.json());


app.use("/companies", companiesRoutes);
app.use("/invoices", invoicesRoutes);
app.use("/industries", industriesRoutes);

/** 404 handler */

app.use(function(req, res, next) {
  const err = new ExpressError("Not Found", 404);
  return next(err);
});

/** general error handler */

app.use((err, req, res, next) => {
  res.status(err.status || 500);

  return res.json({
    message: err.message
  });
});


module.exports = app;
