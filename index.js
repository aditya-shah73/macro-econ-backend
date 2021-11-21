const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
var bodyParser = require("body-parser");
const logger = require('tracer').colorConsole();
const CONFIG = require("./config/config");
app.use(cookieParser());
app.use(express.static('public'));
app.use(cors({ origin: "*", credentials: true }));
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', "*");
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.setHeader('Cache-Control', 'no-cache');
  next();
});

const pool = require('./db/connection');

app.get('/healthcheck', (request, response) => {
  logger.debug('Health Check');
  response.json({
    message: 'Application Running',
  });
});

app.get('/data', async (request, response) => {
  try {
    const {
      table,
      yearFrom,
      yearTo,
      country
    } = request.query;
    const query = `SELECT Year as year, ${country} as country FROM ${table} where Year between ${yearFrom} and ${yearTo} and ${country} IS NOT NULL;`;
    const rows = await pool.query(query);
    let resp = {};
    resp.rows = rows.map(function (el) {
      return [el.year, el.country];
    });
    const anno_query = `SELECT annotation from ANNOTATIONS where table_name="${table}" and country="${country}";`;
    const anno_rows = await pool.query(anno_query);
    if (anno_rows.length > 0) {
      resp.annotation = anno_rows[0]["annotation"];
    } else {
      resp.annotation = ""
    }
    return response.json(resp).status(200);
  } catch (ex) {
    logger.error(JSON.stringify(ex));
    const message = ex.message ? ex.message : 'Error while fetching data';
    const code = ex.statusCode ? ex.statusCode : 500;
    return response.status(code).json({ message });
  }
});

app.post('/annotation', async (request, response) => {
  try {
    const {
      table,
      country,
      text
    } = request.body;
    const query = `REPLACE INTO ANNOTATIONS(table_name, country, annotation) values("${table}","${country}","${text}");`
    const rows = await pool.query(query);
    return response.json({ "message": "success" }).status(200);
  } catch (ex) {
    logger.error(JSON.stringify(ex));
    const message = ex.message ? ex.message : 'Error while updating annotation';
    const code = ex.statusCode ? ex.statusCode : 500;
    return response.status(code).json({ message });
  }
});

app.get('/load', async (request, response) => {
  try {
    const tables = await pool.query("show tables");
    let res = {};
    let resp = {};
    for (const table of tables) {
      const query = `SELECT * from ${table["Tables_in_HACKATHON"]};`;
      const rows = await pool.query(query);
      resp[table["Tables_in_HACKATHON"]] = rows;
    }
    res.tables = resp;
    const anno_query = `SELECT * from ANNOTATIONS;`;
    const anno_rows = await pool.query(anno_query);
    if (anno_rows.length > 0) {
      res.annotations = anno_rows;
    } else {
      res.annotations = []
    }

    return response.json(res).status(200);
  } catch (ex) {
    logger.error(JSON.stringify(ex));
    const message = ex.message ? ex.message : 'Error while fetching data';
    const code = ex.statusCode ? ex.statusCode : 500;
    return response.status(code).json({ message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  logger.debug('App listening on port 3000');
});

module.exports = app;
