let mysql = require('mysql2');

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
    connection.query("SELECT * FROM infos", function (err, result, fields) {
        if (err) throw err;
        console.log(result);
      });
  });

