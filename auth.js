// Underscore
var _ = require('underscore');

// PBKDF2 SHA256
function buildFormattedPBKDF2SHA256(password, iteration = 901) {
    var crypto = require('crypto');
    const salt = crypto.randomBytes(12).toString('base64');
    const key = crypto.pbkdf2Sync(password, salt, iteration, 24, 'sha256');
    const key64 = key.toString('base64');
    const formattedKey = 'PBKDF2' + '$' + 'sha256' + '$' + iteration + '$' + salt + '$' + key64;
    return formattedKey;
}

// Count User
function countUser(pgPool, callback) {

    const searchSql = "SELECT count(username) FROM account";
    pgPool.query(searchSql, function (err, result) {
        if (err) {
            callback(0);
            return;
        }
        callback(result.rows[0].count);
    });
}

// List Super User
function listSU(pgPool, callback) {

    const searchSql = "SELECT username FROM account WHERE super = 1";
    pgPool.query(searchSql, function (err, result) {
        if (err) {
            callback([]);
            return;
        }
        callback(result.rows);
    });
}

// User Exist
function userExist(pgPool, username, callback) {

    const searchSql = "SELECT username, super FROM account WHERE username = '" + username + "'";
    pgPool.query(searchSql, function (err, result) {
        if (err) {
            callback(-1);
            return;
        }
        callback(result.rowCount > 0 ? 0 : -2);
    });
}

// Create Super User
function createSU(pgPool, username, password, callback) {

    username = username.trim();
    password = password.trim();

    const searchSql = "SELECT * FROM account WHERE username = '" + username + "'";
    pgPool.query(searchSql, function (err, result) {
        if (err) {
            callback(-1);
            return;
        }

        if (result.rowCount != 0) {
            callback(-2);
            return;
        }

        const pbkdf2 = buildFormattedPBKDF2SHA256(password);
        const insertSql = "INSERT INTO account (username, pw, super) " +
            "VALUES ('" + username + "', '" + pbkdf2 + "', 1)";

        pgPool.query(insertSql, function (err, result) {
            if (err) {
                callback(-3);
                return;
            }

            callback(0);
        });
    });
}

// Create User
function createUser(pgPool, username, password, topics, callback) {

    username = username.trim();
    password = password.trim();

    let topicSet = new Set();
    let insertTopicsSql = "INSERT INTO acls (username, topic, rw) VALUES ";
    let topicsValues = "";
    for (var i = 0; i < topics.length; ++i) {
        let topicObject = topics[i];
        if (!_.isObject(topicObject)) {
            continue;
        }

        let topic = topicObject.topic;
        let rw = topicObject.rw;

        if (!_.isString(topic) || !_.isNumber(rw)) {
            continue;
        }

        if (topicSet.has(topic)) {
            continue;
        }

        if (i != 0) {
            topicsValues += ', ';
        }
        topicsValues += "('" + username + "', '" + topic + "', " + rw + ")";
        topicSet.add(topic);
    }
    insertTopicsSql += topicsValues;

    if (topicSet.size == 0) {
        callback(-5);
        return;
    }

    const searchSql = "SELECT * FROM account WHERE username = '" + username + "'";
    pgPool.query(searchSql, function (err, result) {
        if (err) {
            callback(-1);
            return;
        }

        if (result.rowCount != 0) {
            callback(-2);
            return;
        }

        const pbkdf2 = buildFormattedPBKDF2SHA256(password);
        const insertSql = "INSERT INTO account (username, pw, super) VALUES " +
            "('" + username + "', '" + pbkdf2 + "', 0)";

        pgPool.query(insertSql, function (err, result) {
            if (err) {
                callback(-3);
                return;
            }

            pgPool.query(insertTopicsSql, function (err, result) {
                if (err) {
                    callback(-4);
                    return;
                }

                callback(0);
            });
        });
    });
}

// Change Password User
function changePasswordUser(pgPool, username, password, callback) {

    username = username.trim();
    password = password.trim();

    const pbkdf2 = buildFormattedPBKDF2SHA256(password);
    const updateSql = "UPDATE account SET pw = '" + pbkdf2 + "' WHERE username = '" + username + "'";

    pgPool.query(updateSql, function (err, result) {
        if (err) {
            callback(-1);
            return;
        }

        if (result.rowCount != 1) {
            callback(-2);
            return;
        }

        callback(0);
    });
}

// Delete User
function deleteUser(pgPool, username, callback) {

    username = username.trim();

    const deleteSql = "DELETE FROM account WHERE username = '" + username + "'";
    pgPool.query(deleteSql, function (err, result) {
        if (err) {
            callback(-1);
            return;
        }

        const deleteTopicsSql = "DELETE FROM acls WHERE username = '" + username + "'";
        pgPool.query(deleteTopicsSql, function (err, result) {
            if (err) {
                callback(-2);
                return;
            }

            callback(0);
        });
    });
}

// Clear
function clear(pgPool, callback) {

    const deleteSql = "DELETE FROM account";
    pgPool.query(deleteSql, function (err, result) {
        if (err) {
            callback(-1);
            return;
        }

        const deleteTopicsSql = "DELETE FROM acls";
        pgPool.query(deleteTopicsSql, function (err, result) {
            if (err) {
                callback(-2);
                return;
            }

            callback(0);
        });
    });
}

module.exports = {
    countUser,
    listSU,
    userExist,
    createSU,
    createUser,
    changePasswordUser,
    deleteUser,
    clear
}
