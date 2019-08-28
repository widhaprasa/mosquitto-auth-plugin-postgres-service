// PBKDF2 SHA256
function genFormattedPBKDF2SHA256(password, iteration = 901) {
    var crypto = require('crypto');
    const salt64 = crypto.randomBytes(12).toString('base64');
    const salt64len = salt64.length;
    const key = crypto.pbkdf2Sync(password, salt64, salt64len, iteration, 'sha256');
    const key64 = key.toString('base64');

    const formattedKey = 'PBKDF2' + '$' + 'sha256' + '$' + iteration + '$' + salt64 + '$' + key64;
    return formattedKey;
}

function createSU(db, username, password, callback) {

    username = username.trim();
    password = password.trim();

    const searchSql = "SELECT * FROM users WHERE username = '" + username + "'";
    db.query(searchSql, function (err, result) {
        if (err) {
            callback(-1);
            return;
        }

        if (result.length != 0) {
            callback(-2);
            return;
        }

        const pbkdf2 = genFormattedPBKDF2SHA256(password);
        const insertSql = "INSERT INTO users (username, pw, super) " +
            "VALUES ('" + username + "', '" + pbkdf2 + "', 1)";

        db.query(insertSql, function (err, result) {
            if (err) {
                callback(-3);
                return;
            }

            callback(0);
        });
    });
}

function createUser(db, username, password, topics, callback) {

    username = username.trim();
    password = password.trim();

    if (topics.length == 0) {
        callback(-5);
        return;
    }

    const searchSql = "SELECT * FROM users WHERE username = '" + username + "'";
    db.query(searchSql, function (err, result) {
        if (err) {
            callback(-1);
            return;
        }

        if (result.length != 0) {
            callback(-2);
            return;
        }

        const pbkdf2 = genFormattedPBKDF2SHA256(password);
        const insertSql = "INSERT INTO users (username, pw, super) VALUES " +
            "('" + username + "', '" + pbkdf2 + "', 0)";

        db.query(insertSql, function (err, result) {
            if (err) {
                callback(-3);
                return;
            }

            let insertTopicsSql = "INSERT INTO acls (username, topic, rw) VALUES ";
            let topicsValues = "";
            for (var i = 0; i < topics.length; ++i) {
                if (i != 0) {
                    topicsValues += ', ';
                }
                topicsValues += "('" + username + "', '" + topics[i] + "', 1)";
            }
            insertTopicsSql += topicsValues;

            db.query(insertTopicsSql, function (err, result) {
                if (err) {
                    callback(-4);
                    return;
                }

                callback(0);
            });
        });
    });
}

function deleteUser(db, username, callback) {

    username = username.trim();

    const deleteSql = "DELETE FROM users WHERE username = '" + username + "'";
    db.query(deleteSql, function (err, result) {
        if (err) {
            callback(-1);
            return;
        }

        const deleteTopicsSql = "DELETE FROM acls WHERE username = '" + username + "'";
        db.query(deleteTopicsSql, function (err, result) {
            if (err) {
                callback(-2);
                return;
            }

            callback(0);
        });
    });
}

module.exports = {
    createSU,
    createUser,
    deleteUser
}