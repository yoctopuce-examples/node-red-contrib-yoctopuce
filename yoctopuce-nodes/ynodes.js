// noinspection JSUnresolvedVariable
module.exports = function (RED) {
    "use strict";
    require('yoctolib-es2017/yocto_api.js');


    function UseYFunction(config)
    {
        RED.nodes.createNode(this, config);
        var node = this;
        this.hwid = config.hwid;
        this.yfun = null;
        this.yoctohub = RED.nodes.getNode(config.yoctohub);
        if (node.yoctohub) {
            // Retrieve the config node
            node.yctx = node.yoctohub.yctx;
            this.status({fill: "red", shape: "ring", text: "node-red:common.status.disconnected"});
            this.onYoctHubReady = function () {
                // by default use any connected module suitable for the demo
                let yfun;
                if (node.hwid) {
                    yfun = YFunction.FindFunctionInContext(node.yctx, node.hwid);
                } else {
                    yfun = YFunction.FirstFunctionInContext(node.yctx);
                }
                node.setupFunNodeSate(yfun, true);

            };
            this.setupFunNodeSate = function (yfun, registerCb) {
                if (!yfun) {
                    node.warn("No function connected on " + node.yoctohub);
                    return;
                }
                node.status({fill: "yellow", shape: "dot", text: "running"});
                node.log("use  " + node.hwid + " on " + node.yoctohub.hostname);
                node.yfun = yfun;
                if (registerCb) {
                    node.yfun.registerValueCallback(function (obj_fct, str_value) {
                        let msg = {payload: str_value, topic: node.name};
                        node.send(msg);
                    });
                }
                node.yfun.isOnline().then((isonline) => {
                    if (!isonline) {
                        node.warn("No function " + node.hwid + " connected on " + node.yoctohub);
                        return;
                    }
                    node.status({fill: "green", shape: "dot", text: "running"});
                });
            };


            this.yoctohub.register(this);
            this.on('close', function (done) {
                node.yoctohub.deregister(node, done);
            });
        } else {
            node.status({fill: "red", shape: "ring", text: "No YoctoHub configured"});
        }
    }

    function UseYSensor(config)
    {
        UseYFunction.call(this, config);
        this.sensor = null;
        this.useTimeNot = config.useTimeNot;
        var node = this;

        this.onYoctHubReady = function () {
            let sensor;
            if (node.hwid) {
                sensor = YSensor.FindSensorInContext(node.yctx, node.hwid);
            } else {
                sensor = YSensor.FirstSensorInContext(node.yctx);
            }
            node.sensor = sensor;
            if (node.useTimeNot) {
                node.setupFunNodeSate(sensor, false);
                sensor.registerTimedReportCallback(function (func, ymeasure) {
                    let avg = ymeasure.get_averageValue();
                    let msg = {payload: avg, topic: node.name};
                    node.send(msg);
                })
            } else {
                node.setupFunNodeSate(sensor, true);
            }
        };

    }

    RED.nodes.registerType("yoctopuce-function", UseYFunction);
    RED.nodes.registerType("yoctopuce-sensor", UseYSensor);


    require('yoctolib-es2017/yocto_relay.js');


    require('yoctolib-es2017/yocto_buzzer.js');

    function UseYBuzzer(config)
    {
        UseYFunction.call(this, config);
        this.ybuzzer = null;
        this.command = config.command;
        var node = this;
        this.onYoctHubReady = function () {
            // by default use any connected module suitable for the demo
            let buzzer;
            if (node.hwid) {
                buzzer = YBuzzer.FindBuzzerInContext(node.yctx, node.hwid);
            } else {
                buzzer = YBuzzer.FirstBuzzerInContext(node.yctx);
            }
            node.setupFunNodeSate(lower_classname, false);
            node.ybuzzer = buzzer;
            node.on('input', function (msg) {
                switch (node.command) {
                    case 'set_frequency':
                        node.ybuzzer.set_frequency(msg.payload);
                        break;
                    case 'set_volume':
                        node.ybuzzer.set_volume(msg.payload);
                        break;
                    case 'playNotes':
                        node.ybuzzer.playNotes(msg.payload);
                        break;
                    default:
                        node.warn('unknown command : ' + msg.payload);
                }
            });
        };
    }

    RED.nodes.registerType('yoctopuce-buzzer', UseYBuzzer);

    function UseYRelay(config)
    {
        UseYFunction.call(this, config);
        this.yrelay = null;
        var node = this;

        this.onYoctHubReady = function () {
            // by default use any connected module suitable for the demo
            let relay;
            if (node.hwid) {
                relay = YRelay.FindRelayInContext(node.yctx, node.hwid);
            } else {
                relay = YRelay.FirstRelayInContext(node.yctx);
            }
            node.setupFunNodeSate(relay, true);
            node.yrelay = relay;
            node.on('input', function (msg) {
                switch (msg.payload.toUpperCase()) {
                    case 'A':
                        node.yrelay.set_state(YRelay.STATE_A);
                        break;
                    case 'B':
                        node.yrelay.set_state(YRelay.STATE_B);
                        break;
                    case 'ON':
                        node.yrelay.set_output(YRelay.OUTPUT_ON);
                        break;
                    case 'OFF':
                        node.yrelay.set_output(YRelay.OUTPUT_OFF);
                        break;
                    default:
                        node.warn("unknown state : " + msg.payload);

                }

            });

        };

    }

    RED.nodes.registerType("yoctopuce-relay", UseYRelay);
}