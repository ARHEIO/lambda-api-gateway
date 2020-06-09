/* eslint-disable @typescript-eslint/no-var-requires */
const http = require('http');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const app = express();

const { appRoutes } = require(process.env.ROUTES_FILE_LOCATION);

// view engine setup
app.set('port', process.env.PORT || 9002);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.all('/*', (req, res, next) => {
  res.set('Content-Type', 'application/json');
  // Allow CORS requests on stub.
  res.set('Access-Control-Allow-Origin', req.headers.origin);
  res.set('Access-Control-Allow-Headers', 'Content-Type,X-Requested-With,accept,api-key');
  res.set('Access-Control-Allow-Credentials', 'true');
  res.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT, PATCH');
  res.set('X-Request-URL', req.url);
  next();
});

app.get('/ping', async (req, res) => {
  res.status(200).send('pong');
})

const LAMBDA_PATH = appRoutes.lambdaPath;

// handles all paths with one path param
app.all(`${appRoutes.basePath}/*`, (req, res, next) => {
  console.debug('Adding generic params');
  res.locals.lambdaBody = {
    httpMethod: req.method,
    queryStringParameters: req.query,
    path: `/${req.path.split('/')[2]}`
  }
  next();
})

// to handle paths with multiple path params
appRoutes.routes.forEach(route => {
  let pathParams = route
    .split('/')
    .filter((param) => param[0] === ':')
    .map(param => param.slice(1));

  return app.all(`${appRoutes.basePath}${route}`, (req, res, next) => {
    console.log('Request on ', `${appRoutes.basePath}${route}`)
    pathParams.forEach((param) => {
      res.locals.lambdaBody[param] = req.params[param];
    })
    next();
  })
})

app.all(`${appRoutes.basePath}/*`, async(req, res) => {
  console.log('Request:', JSON.stringify(res.locals.lambdaBody));
  axios.post(LAMBDA_PATH, res.locals.lambdaBody).then(response => {
    res.status = response.data.statusCode;
    res.headers = response.data.headers;
    res.send(response.data.body);
  }).catch((err) => {
    res.status = 500;
    res.send(err.message);
  })
});

http.createServer(app).listen(app.get('port'), () => {
  console.log(`Server listening on port ${app.get('port')}`);
});
