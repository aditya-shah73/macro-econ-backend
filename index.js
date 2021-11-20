const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('tracer').colorConsole();
const CONFIG = require("./config/config");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
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
    const query = 'select * from BALANCE';
    const rows = await pool.query(query);
    return response.json(rows).status(200);
  } catch (ex) {
    logger.error(JSON.stringify(ex));
    const message = ex.message ? ex.message : 'Error while uploading image';
    const code = ex.statusCode ? ex.statusCode : 500;
    return response.status(code).json({ message });
  }
});

app.listen(8080, () => {
  logger.debug('App listening on port 8080');
});

module.exports = app;
