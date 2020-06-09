module.exports = {
  appRoutes: {
    basePath: '/my-lambda',
    lambdaPath: 'http://localhost:9001/2015-03-31/functions/-/invocations',
    routes: [
      '/posts/',
      '/posts/:id',
    ]
  }
}