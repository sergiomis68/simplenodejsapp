const Prometheus = require('prom-client')
const express = require('express');
const http = require('http');
const mysql = require('mysql2');

var dbdata = null;

Prometheus.collectDefaultMetrics();

const requestHistogram = new Prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['code', 'handler', 'method'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
})

const requestTimer = (req, res, next) => {
  const path = new URL(req.url, `http://${req.hostname}`).pathname
  const stop = requestHistogram.startTimer({
    method: req.method,
    handler: path
  })
  res.on('finish', () => {
    stop({
      code: res.statusCode
    })
  })
  next()
}

const app = express();
const server = http.createServer(app)

// See: http://expressjs.com/en/4x/api.html#app.settings.table
const PRODUCTION = app.get('env') === 'production';

// Administrative routes are not timed or logged, but for non-admin routes, pino
// overhead is included in timing.
app.get('/ready', (req, res) => res.status(200).json({status:"ok"}));
app.get('/live', (req, res) => res.status(200).json({status:"ok"}));
app.get('/metrics', (req, res, next) => {
  res.set('Content-Type', Prometheus.register.contentType)
  res.end(Prometheus.register.metrics())
})

// DB CONNECTION 


// DB CONN & QUERY
function getRows(res){

    let connection = mysql.createConnection({
      host: 'mysql.sergione-dev.svc.cluster.local',
      user: 'tester',
      password: 'Pass1234',
      database: 'testdb'
    });
  
    connection.connect(function(err) {
        if (err) {
          return console.error('error: ' + err.message);
        }

        console.log('Connected to the MySQL server.');
        connection.query("SELECT name, description FROM infos", function (err, result, fields) {
            if (err) throw err;
            console.log(result);
            dbdata = result;
            connection.end();
            res.send(dbdata);
          });
      });
} 
// DB CONN & QUERY END

// Time routes after here.
app.use(requestTimer);

// Log routes after here.
const pino = require('pino')({
  level: PRODUCTION ? 'info' : 'debug',
});
app.use(require('pino-http')({logger: pino}));

app.get('/', (req, res) => {
    

  // Use req.log (a `pino` instance) to log JSON:	
  req.log.info({message: 'MySQL query'});		
  //res.send('MySQL query result:');
  //res.send(dbdata);
  getRows(res); 
});	


app.get('*', (req, res) => {
  res.status(404).send("Not Found");
});

// Listen and serve.
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`App started on PORT ${PORT}`);
});
