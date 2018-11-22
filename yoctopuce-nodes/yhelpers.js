// noinspection JSUnresolvedVariable
module.exports = function (RED) {
    "use strict";

    function YSQLHelper(config)
    {

        RED.nodes.createNode(this, config);
        this.tablename = config.tablename;
        this.operation = config.operation;
        this.filter_hwid = config.filter_hwid;
        this.filter_op = config.filter_op;
        this.filter_size = config.filter_size;
        this.output = config.output;
        this.name = config.name;
        var node = this;
        node.on('input', function (msg) {
            let sql_req;
            switch (node.operation) {
                case 'insert':
                    let t;
                    //fixme: ensure topic exist
                    if (msg.timestamp) {
                        t = msg.timestamp;
                    }else{
                        t = Date.now();
                    }
                    sql_req = "INSERT INTO " + node.tablename + " VALUES ( " + t + ", " + msg.payload + ", \"" + msg.topic + "\")";
                    break;
                case "select":
                    sql_req = "SELECT * FROM " + node.tablename;
                    if (node.filter_hwid !== '') {
                        sql_req += " WHERE hwid=\"" + node.filter_hwid + "\"";
                    }
                    if (node.filter_size !== 'all') {
                        if (node.filter_op === 'first') {
                            sql_req += " ORDER BY timestamp ASC"
                        } else if (node.select_op === 'last') {
                            sql_req += " ORDER BY timestamp DESC"
                        }
                        sql_req += " LIMIT " + node.filter_size;
                    }
                    break;
                case "delete":
                    sql_req = "DELETE FROM " + node.tablename;
                    if (node.filter_hwid !== '') {
                        sql_req += " WHERE hwid=\"" + node.filter_hwid + "\"";
                    }
                    if (node.filter_size !== 'all') {
                        if (node.filter_op === 'first') {
                            sql_req += " ORDER BY timestamp ASC"
                        } else if (node.select_op === 'last') {
                            sql_req += " ORDER BY timestamp DESC"
                        }
                        sql_req += " LIMIT " + node.filter_size;
                    }
                    break;
                case "create":
                    sql_req = "CREATE TABLE " + node.tablename + "( timestamp INT NOT NULL, value REAL NOT NULL, hwid TEXT NOT NULL)";
                    break;
                case "drop":
                    sql_req = "DROP TABLE " + node.tablename;
                    break;
                default:
                    node.error("Unsupported operation:", node.operation);
                    break
            }
            if (node.output === 'payload') {
                msg.payload = sql_req;
            } else {
                msg.topic = sql_req;
            }
            node.send(msg);
        });

    }

    RED.nodes.registerType('YDbSplit', YDbSplit);


    function YDbSplit(config)
    {

        RED.nodes.createNode(this, config);
        this.name = config.name;
        var node = this;
        node.on('input', function (msg) {
            for (let index in msg.payload) {
                let record = msg.payload[index];
                let new_msg = {payload: record.value, topic: record.hwid, timestamp: record.timestamp};
                node.send(new_msg);
            }
        });

    }

    RED.nodes.registerType('YDbSplit', YDbSplit);


};
