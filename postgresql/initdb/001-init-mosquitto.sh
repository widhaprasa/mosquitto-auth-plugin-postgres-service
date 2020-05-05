#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE ROLE mosquitto_acl WITH LOGIN PASSWORD 'mosquitto_acl';
    CREATE DATABASE mosquitto_acl WITH OWNER mosquitto_acl;

    \c mosquitto_acl

    CREATE TABLE account
    (
        id serial PRIMARY KEY,
        username varchar(255),
        group_ varchar(255),
        pw text,
        super integer
    );
    ALTER TABLE account OWNER TO mosquitto_acl;

    CREATE TABLE acls
    (
        id serial PRIMARY KEY,
        username varchar(255),
        group_ varchar(255),
        topic varchar(255),
        rw integer
    );
    ALTER TABLE acls OWNER TO mosquitto_acl;

    CREATE INDEX account_username ON account(username);
    CREATE INDEX account_group ON account(group_);
    CREATE INDEX acls_username ON acls(username);
    CREATE INDEX acls_group ON acls(group_);
EOSQL
