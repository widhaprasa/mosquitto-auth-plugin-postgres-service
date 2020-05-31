'use strict';

// Express
var express = require('express');
const EXPRESS_PORT = 3000;
const EXPRESS_HOST = '0.0.0.0';

// Underscore
var _ = require('underscore');

// PostgreSQL
var Pool = require('pg').Pool;
var pqConfig = {};
pqConfig.host = !_.isEmpty(process.env.PG_HOST) ? process.env.PG_HOST : 'localhost';
pqConfig.port = !_.isEmpty(process.env.PG_PORT) ? process.env.PG_PORT : 5432;
pqConfig.database = !_.isEmpty(process.env.PG_DB) ? process.env.PG_DB : 'mosquitto_acl';
pqConfig.user = !_.isEmpty(process.env.PG_USER) ? process.env.PG_USER : 'mosquitto_acl';
pqConfig.password = !_.isEmpty(process.env.PG_PASSWORD) ? process.env.PG_PASSWORD : 'mosquitto_acl';

var pgPool = new Pool(pqConfig);

// Auth
var auth = require('./auth.js');

// App
var app = express();
app.use(express.json());

app.get('/health', (req, res) => {
    res.send('ok');
});

app.get('/account/count', (req, res) => {

    auth.countAccount(pgPool, function (result) {
        res.send(result);
    });
});

app.post('/account/exist', (req, res) => {

    const body = req.body;
    if (!_.isString(body.username)) {
        res.sendStatus(400);
        return;
    }

    auth.accountExist(pgPool, body.username, function (code) {
        res.send(code == 0);
    });
});

app.post('/account/change/password', (req, res) => {

    const body = req.body;
    if (!_.isString(body.username) || !_.isString(body.password)) {
        res.sendStatus(400);
        return;
    }

    auth.changePasswordAccount(pgPool, body.username, body.password, function (code) {
        if (code == 0) {
            res.sendStatus(200);
        } else {
            res.sendStatus(400);
        }
    });
});

app.post('/account/remove', (req, res) => {

    const body = req.body;
    if (!_.isString(body.username)) {
        res.sendStatus(400);
        return;
    }

    auth.deleteAccount(pgPool, body.username, function (code) {
        if (code == 0) {
            res.sendStatus(200);
        } else {
            res.sendStatus(400);
        }
    });
});

app.post('/account/remove/group', (req, res) => {

    const body = req.body;
    if (!_.isString(body.group)) {
        res.sendStatus(400);
        return;
    }

    auth.deleteAccountByGroup(pgPool, body.group, function (code) {
        if (code == 0) {
            res.sendStatus(200);
        } else {
            res.sendStatus(400);
        }
    });
});

app.post('/account/clear', (req, res) => {

    auth.clearAccount(pgPool, function (code) {
        if (code == 0) {
            res.sendStatus(200);
        } else {
            res.sendStatus(400);
        }
    });
});

app.get('/su/list', (req, res) => {

    auth.listSU(pgPool, function (result) {
        const arr = [];
        for (let i in result) {
            arr.push(result[i].username);
        }
        res.send(arr);
    });
});

app.post('/su/add', (req, res) => {

    const body = req.body;
    if (!_.isString(body.username) || !_.isString(body.password)) {
        res.sendStatus(400);
        return;
    }

    auth.createSU(pgPool, body.username, body.password, function (code) {
        if (code == 0) {
            res.sendStatus(200);
        } else {
            res.sendStatus(400);
        }
    });
});

app.post('/user/add', (req, res) => {

    const body = req.body;
    if (!_.isString(body.username) || !_.isString(body.group) || !_.isString(body.password) || !_.isArray(body.topics)) {
        res.sendStatus(400);
        return;
    }

    auth.createUser(pgPool, body.username, body.group, body.password, body.topics, function (code) {
        if (code == 0) {
            res.sendStatus(200);
        } else {
            res.sendStatus(400);
        }
    });
});

// Main
pgPool.connect((err) => {
    if (err) {
        throw err;
    }

    app.listen(EXPRESS_PORT, EXPRESS_HOST, function () {
        console.log('##################################################');
        console.log('');
        console.log('Listening on ' + EXPRESS_HOST + ':' + EXPRESS_PORT);
        console.log('');
        console.log('##################################################');
    });
});
