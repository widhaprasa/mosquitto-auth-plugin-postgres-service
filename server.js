'use strict';

// Express
var express = require('express');
const EXPRESS_PORT = 3000;
const EXPRESS_HOST = '0.0.0.0';

// MySQL
var mysql = require('mysql');
var mysqlConfig = {};
mysqlConfig.host = process.env.MYSQL_HOST != null ? process.env.MYSQL_HOST : 'localhost';
mysqlConfig.port = process.env.MYSQL_PORT != null ? process.env.MYSQL_PORT : 3306;
mysqlConfig.database = process.env.MYSQL_DATABASE != null ? process.env.MYSQL_DATABASE : 'mosquitto_acl';
if (process.env.MYSQL_USER != null) {
    mysqlConfig.user = process.env.MYSQL_USER;
}
if (process.env.MYSQL_PASSWORD != null) {
    mysqlConfig.password = process.env.MYSQL_PASSWORD;
}

var db = mysql.createConnection(mysqlConfig);
db.connect((err) => {
    if (err) {
        throw err;
    }
});

// Auth
var auth = require('./auth.js');

// App
var app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello world\n');
});

app.post('/add/su', (req, res) => {
    const body = req.body;
    auth.createSU(db, body.username, body.password, function (code) {
        if (code == 0) {
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    });
});

app.post('/add/user', (req, res) => {
    const body = req.body;
    auth.createUser(db, body.username, body.password, body.topics, function (code) {
        if (code == 0) {
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    });
});

app.post('/remove/user', (req, res) => {
    const body = req.body;
    auth.deleteUser(db, body.username, function (code) {
        if (code == 0) {
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    });
});

app.listen(EXPRESS_PORT, EXPRESS_HOST, function () {
    console.log('Listening on ' + EXPRESS_HOST + ':' + EXPRESS_PORT);
});
