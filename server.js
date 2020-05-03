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
pqConfig.host = process.env.PG_HOST != null ? process.env.PG_HOST : 'm2mdev.tritronik.com';
pqConfig.port = process.env.PG_PORT != null ? process.env.PG_PORT : 55432;
pqConfig.database = 'mosquitto_acl';
pqConfig.user = 'mosquitto_acl';
pqConfig.password = 'mosquitto_acl';

var pgPool = new Pool(pqConfig);

// Auth
var auth = require('./auth.js');

// App
var app = express();
app.use(express.json());

app.get('/health', (req, res) => {
    
    res.send('ok');
});

app.get('/count/user', (req, res) => {
    
    auth.countUser(pgPool, function (result) {
        res.send(result);
    });
});

app.post('/exist/user', (req, res) => {

    const body = req.body;
    if (!_.isString(body.username)) {
        res.sendStatus(400);
        return;
    }

    auth.userExist(pgPool, body.username, function (code) {
        res.send(code == 0);
    });
});

app.get('/list/su', (req, res) => {
    
    auth.listSU(pgPool, function (result) {
        const arr = [];
        for (let i in result) {
            arr.push(result[i].username);
        }
        res.send(arr);
    });
});

app.post('/add/su', (req, res) => {

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

app.post('/add/user', (req, res) => {

    const body = req.body;
    if (!_.isString(body.username) || !_.isString(body.password) || !_.isArray(body.topics)) {
        res.sendStatus(400);
        return;
    }

    auth.createUser(pgPool, body.username, body.password, body.topics, function (code) {
        if (code == 0) {
            res.sendStatus(200);
        } else {
            res.sendStatus(400);
        }
    });
});

app.post('/change/password/user', (req, res) => {

    const body = req.body;
    if (!_.isString(body.username) || !_.isString(body.password)) {
        res.sendStatus(400);
        return;
    }

    auth.changePasswordUser(pgPool, body.username, body.password, function (code) {
        if (code == 0) {
            res.sendStatus(200);
        } else {
            res.sendStatus(400);
        }
    });
});

app.post('/remove/user', (req, res) => {

    const body = req.body;
    if (!_.isString(body.username)) {
        res.sendStatus(400);
        return;
    }

    auth.deleteUser(pgPool, body.username, function (code) {
        if (code == 0) {
            res.sendStatus(200);
        } else {
            res.sendStatus(400);
        }
    });
});

app.post('/clear', (req, res) => {

    auth.clear(pgPool, function (code) {
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
