const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const logger = require('tracer').colorConsole();
const CONFIG = require("./config/config");
app.use(cookieParser());
app.use(express.static('public'));
app.use(cors({ origin: CONFIG.REACT_URL, credentials: true }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', CONFIG.REACT_URL);
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
    const query = `SELECT Year as year, ${country} as country, ${country}_Annotation_Title as title, ${country}_Annotation_Text as text FROM ${table} where Year between ${yearFrom} and ${yearTo} and ${country} IS NOT NULL;`;
    const rows = await pool.query(query);
    let resp = rows.map(function (el) {
      return [el.year, el.country, el.title == null ? "" : el.title, el.text == null ? "" : el.text];
    });
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
      year,
      country,
      title,
      text
    } = request.body;
    const query = `UPDATE ${table} SET ${country}_Annotation_Title = "${title}", ${country}_Annotation_Text = "${text}" where Year=${year};`;
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
    let resp = {};
    for (const table of tables) {
      const query = `SELECT * from ${table["Tables_in_HACKATHON"]};`;
      const rows = await pool.query(query);
      resp[table["Tables_in_HACKATHON"]] = rows;
    }
    return response.json(resp).status(200);
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
