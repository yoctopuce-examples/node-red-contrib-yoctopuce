// noinspection JSUnresolvedVariable
module.exports = function (RED) {
    "use strict";
    // noinspection JSUnresolvedFunction
    require('yoctolib-es2017/yocto_api.js');


    function UseYFunction(config)
    {
        // noinspection JSUnresolvedVariable
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
            // noinspection JSUnresolvedFunction
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
        this.useTimeNot = config.useTimeNot;
        var node = this;

        this.onYoctHubReady = async function () {
            let sensor;
            if (node.hwid) {
                sensor = YSensor.FindSensorInContext(node.yctx, node.hwid);
            } else {
                sensor = YSensor.FirstSensorInContext(node.yctx);
            }
            if (node.useTimeNot) {
                node.setupFunNodeSate(sensor, false);
                await sensor.registerTimedReportCallback(function (func, ymeasure) {
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
            node.setupFunNodeSate(buzzer, false);
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
                        node.warn('unknown command : ' + node.command);
                }
            });
        };
    }

    RED.nodes.registerType('yoctopuce-buzzer', UseYBuzzer);

    require('yoctolib-es2017/yocto_colorled.js');

    function UseYColorLed(config)
    {
        UseYFunction.call(this, config);
        this.ycolorled = null;
        this.command = config.command;
        this.msdelay = config.msdelay;
        var node = this;
        this.onYoctHubReady = function () {
            // by default use any connected module suitable for the demo
            let colorled;
            if (node.hwid) {
                colorled = YColorLed.FindColorLedInContext(node.yctx, node.hwid);
            } else {
                colorled = YColorLed.FirstColorLedInContext(node.yctx);
            }
            node.setupFunNodeSate(colorled, false);
            node.ycolorled = colorled;
            node.on('input', function (msg) {
                let data = msg.payload;
                let color = data;
                if (typeof data === "string") {
                    if (data.substring(0, 1) === "#") {
                        data = data.substring(1);
                        color = parseInt(data, 16)
                    } else if (color.substring(0, 2) === "0x") {
                        data = data.substring(2);
                        color = parseInt(data, 16)
                    } else {
                        color = parseInt(data)
                    }
                }
                switch (node.command) {
                    case 'set_rgbColor':
                        if (node.msdelay === 0) {
                            node.ycolorled.set_rgbColor(color);
                        } else {
                            node.ycolorled.rgbMove(color, node.msdelay);
                        }
                        break;
                    case 'set_hslColor':
                        if (node.msdelay === 0) {
                            node.ycolorled.set_hslColor(color);
                        } else {
                            node.ycolorled.hslMove(color, node.msdelay);
                        }
                        break;
                    default:
                        node.warn('unknown command : ' + node.command);
                }
            });
        };
    }

    RED.nodes.registerType('yoctopuce-colorled', UseYColorLed);

    require('yoctolib-es2017/yocto_colorledcluster.js');

    function UseYColorLedCluster(config)
    {
        UseYFunction.call(this, config);
        this.ycolorledcluster = null;
        this.command = config.command;
        var node = this;
        this.onYoctHubReady = function () {
            // by default use any connected module suitable for the demo
            let colorledcluster;
            if (node.hwid) {
                colorledcluster = YColorLedCluster.FindColorLedClusterInContext(node.yctx, node.hwid);
            } else {
                colorledcluster = YColorLedCluster.FirstColorLedClusterInContext(node.yctx);
            }
            node.setupFunNodeSate(colorledcluster, false);
            node.ycolorledcluster = colorledcluster;
            node.on('input', async function (msg) {
                if (node.command === 'startBlinkSeq') {
                    node.ycolorledcluster.startBlinkSeq(msg.payload);
                } else if (node.command === 'stopBlinkSeq') {
                    node.ycolorledcluster.stopBlinkSeq(msg.payload);
                } else {
                    let data = msg.payload;
                    let color = data;
                    if (typeof data === "string") {
                        if (data.substring(0, 1) === "#") {
                            data = data.substring(1);
                            color = parseInt(data, 16)
                        } else if (color.substring(0, 2) === "0x") {
                            data = data.substring(2);
                            color = parseInt(data, 16)
                        } else {
                            color = parseInt(data)
                        }
                    }
                    let count = await node.ycolorledcluster.get_activeLedCount();
                    switch (node.command) {
                        case 'set_rgbColor':
                            node.ycolorledcluster.set_rgbColor(0, count, color);
                            break;
                        case 'set_hslColor':
                            node.ycolorledcluster.set_hslColor(0, count, color);
                            break;
                        default:
                            node.warn('unknown command : ' + node.command);
                    }
                }
            });
        };
    }

    RED.nodes.registerType('yoctopuce-colorledcluster', UseYColorLedCluster);

    require('yoctolib-es2017/yocto_currentloopoutput.js');

    function UseYCurrentLoopOutput(config)
    {
        UseYFunction.call(this, config);
        this.ycurrentloopoutput = null;
        this.command = config.command;
        var node = this;
        this.onYoctHubReady = function () {
            // by default use any connected module suitable for the demo
            let currentloopoutput;
            if (node.hwid) {
                currentloopoutput = YCurrentLoopOutput.FindCurrentLoopOutputInContext(node.yctx, node.hwid);
            } else {
                currentloopoutput = YCurrentLoopOutput.FirstCurrentLoopOutputInContext(node.yctx);
            }
            node.setupFunNodeSate(currentloopoutput, false);
            node.ycurrentloopoutput = currentloopoutput;
            node.on('input', function (msg) {
                switch (node.command) {
                    case 'set_current':
                        node.ycurrentloopoutput.set_current(msg.payload);
                        break;

                    default:
                        node.warn('unknown command : ' + msg.payload);
                }
            });
        };
    }

    RED.nodes.registerType('yoctopuce-currentloopoutput', UseYCurrentLoopOutput);


    require('yoctolib-es2017/yocto_digitalio.js');

    function UseYDigitalIO(config)
    {
        UseYFunction.call(this, config);
        this.ydigitalio = null;
        this.command = config.command;
        var node = this;
        this.onYoctHubReady = function () {
            // by default use any connected module suitable for the demo
            let digitalio;
            if (node.hwid) {
                digitalio = YDigitalIO.FindDigitalIOInContext(node.yctx, node.hwid);
            } else {
                digitalio = YDigitalIO.FirstDigitalIOInContext(node.yctx);
            }
            node.setupFunNodeSate(digitalio, false);
            node.ydigitalio = digitalio;
            node.on('input', function (msg) {
                switch (node.command) {
                    case 'set_portState':
                        node.ydigitalio.set_portState(msg.payload);
                        break;
                    default:
                        node.warn('unknown command : ' + msg.payload);
                }
            });
        };
    }

    RED.nodes.registerType('yoctopuce-digitalio', UseYDigitalIO);

    require('yoctolib-es2017/yocto_display.js');

    function UseYDisplay(config)
    {
        UseYFunction.call(this, config);
        this.ydisplay = null;
        this.command = config.command;
        this.font = config.font;
        this.w = 0;
        this.h = 0;
        this.layer2 = null;
        var node = this;
        this.onYoctHubReady = async function () {
            // by default use any connected module suitable for the demo
            let display;
            if (node.hwid) {
                display = YDisplay.FindDisplayInContext(node.yctx, node.hwid);
            } else {
                display = YDisplay.FirstDisplayInContext(node.yctx);
            }
            node.setupFunNodeSate(display, false);
            node.ydisplay = display;
            //clean up
            await node.ydisplay.resetAll();

            // retrieve the display size
            node.w = await node.ydisplay.get_displayWidth();
            node.h = await node.ydisplay.get_displayHeight();

            // retrieve the first layer
            node.layer2 = await node.ydisplay.get_displayLayer(2);
            let layer3 = await node.ydisplay.get_displayLayer(3);
            await layer3.clear();
            await layer3.selectFont(node.font);
            await node.layer2.selectFont(node.font);

            node.on('input', async function (msg) {
                switch (node.command) {
                    case 'display':
                        // display a text in the middle of the screen
                        await node.layer2.selectColorPen(0);
                        await node.layer2.drawBar(0, 0, node.w - 1, node.h - 1);
                        await node.layer2.selectColorPen(0xffffff);
                        await node.layer2.drawText(node.w / 2, node.h / 2, YDisplayLayer.ALIGN_CENTER, msg.payload);
                        await node.ydisplay.swapLayerContent(2, 3);
                        break;
                    case 'playSequence':
                        node.ydisplay.playSequence(msg.payload);
                        break;
                    default:
                        node.warn('unknown command : ' + msg.payload);
                }
            });
        };
    }

    RED.nodes.registerType('yoctopuce-display', UseYDisplay);

    require('yoctolib-es2017/yocto_led.js');

    function UseYLed(config)
    {
        UseYFunction.call(this, config);
        this.yled = null;
        this.command = config.command;
        var node = this;
        this.onYoctHubReady = function () {
            // by default use any connected module suitable for the demo
            let led;
            if (node.hwid) {
                led = YLed.FindLedInContext(node.yctx, node.hwid);
            } else {
                led = YLed.FirstLedInContext(node.yctx);
            }
            node.setupFunNodeSate(led, false);
            node.yled = led;
            node.on('input', function (msg) {
                switch (node.command) {
                    case 'set_luminosity':
                        node.yled.set_luminosity(msg.payload);
                        break;
                    case 'set_state':
                        switch (msg.payload.toUpperCase()) {
                            case 'OFF':
                                node.yled.set_power(YLed.POWER_OFF);
                                break;
                            case 'STILL':
                                node.yled.set_power(YLed.POWER_ON);
                                node.yled.set_blinking(YLed.BLINKING_STILL);
                                break;
                            case 'RELAX':
                                node.yled.set_power(YLed.POWER_ON);
                                node.yled.set_blinking(YLed.BLINKING_RELAX);
                                break;
                            case 'AWARE':
                                node.yled.set_power(YLed.POWER_ON);
                                node.yled.set_blinking(YLed.BLINKING_AWARE);
                                break;
                            case 'RUN':
                                node.yled.set_power(YLed.POWER_ON);
                                node.yled.set_blinking(YLed.BLINKING_RUN);
                                break;
                            case 'CALL':
                                node.yled.set_power(YLed.POWER_ON);
                                node.yled.set_blinking(YLed.BLINKING_CALL);
                                break;
                            case 'PANIC':
                                node.yled.set_power(YLed.POWER_ON);
                                node.yled.set_blinking(YLed.BLINKING_PANIC);
                                break;
                            default:
                                node.warn('unknown blinking : ' + msg.payload);
                                break;
                        }
                        break;
                    default:
                        node.warn('unknown command : ' + node.command);
                }
            });
        };
    }

    RED.nodes.registerType('yoctopuce-led', UseYLed);

    require('yoctolib-es2017/yocto_pwmoutput.js');

    function UseYPwmOutput(config)
    {
        UseYFunction.call(this, config);
        this.ypwmoutput = null;
        this.command = config.command;
        var node = this;
        this.onYoctHubReady = function () {
            // by default use any connected module suitable for the demo
            let pwmoutput;
            if (node.hwid) {
                pwmoutput = YPwmOutput.FindPwmOutputInContext(node.yctx, node.hwid);
            } else {
                pwmoutput = YPwmOutput.FirstPwmOutputInContext(node.yctx);
            }
            node.setupFunNodeSate(pwmoutput, false);
            node.ypwmoutput = pwmoutput;
            node.on('input', function (msg) {
                switch (node.command) {
                    case 'set_frequency':
                        node.ypwmoutput.set_frequency(msg.payload);
                        break;
                    case 'set_dutyCycle':
                        node.ypwmoutput.set_dutyCycle(msg.payload);
                        break;
                    default:
                        node.warn('unknown command : ' + node.command);
                }
            });
        };
    }

    RED.nodes.registerType('yoctopuce-pwmoutput', UseYPwmOutput);
    require('yoctolib-es2017/yocto_relay.js');

    function UseYRelay(config)
    {
        UseYFunction.call(this, config);
        this.yrelay = null;
        this.command = config.command;
        this.msdelay = config.msdelay;
        var node = this;

        this.onYoctHubReady = function () {
            // by default use any connected module suitable for the demo
            let relay;
            if (node.hwid) {
                relay = YRelay.FindRelayInContext(node.yctx, node.hwid);
            } else {
                relay = YRelay.FirstRelayInContext(node.yctx);
            }
            node.setupFunNodeSate(relay, false);
            node.yrelay = relay;
            node.on('input', function (msg) {
                let val = msg.payload;
                switch (node.command) {
                    case 'set_state':
                        if (typeof val === "string") {
                            val = val.toLowerCase();
                            if (val === 'b') {
                                val = YRelay.STATE_B;
                            } else {
                                val = YRelay.STATE_A;
                            }
                        }
                        node.yrelay.set_state(val);
                        break;
                    case 'set_output':
                        if (typeof val === "string") {
                            val = val.toLowerCase();
                            if (val === 'on') {
                                val = YRelay.OUTPUT_ON;
                            } else {
                                val = YRelay.OUTPUT_OFF;
                            }
                        }
                        node.yrelay.set_output(val);
                        break;
                    case 'pulse':
                        node.yrelay.pulse(msg.payload);
                        break;
                    default:
                        node.warn('unknown command : ' + node.command);
                }

            });

        };

    }

    RED.nodes.registerType('yoctopuce-relay', UseYRelay);


    require('yoctolib-es2017/yocto_serialport.js');
    function UseYSerialPort(config) {
        UseYFunction.call(this, config);
        this.yserialport = null;
        var node = this;
        this.onYoctHubReady = function () {
            // by default use any connected module suitable for the demo
            let serialport;
            if (node.hwid) {
                serialport = YSerialPort.FindSerialPortInContext(node.yctx, node.hwid);
            } else {
                serialport = YSerialPort.FirstSerialPortInContext(node.yctx);
            }
            node.setupFunNodeSate(lower_classname, false);
            node.yserialport = serialport;
            node.on('input', function (msg) {
                switch (node.command) {
                    case 'set_currentJob':
                        node.yserialport.set_currentJob(msg.payload);
                        break;
                    case 'set_startupJob':
                        node.yserialport.set_startupJob(msg.payload);
                        break;
                    case 'set_voltageLevel':
                        node.yserialport.set_voltageLevel(msg.payload);
                        break;
                    case 'set_protocol':
                        node.yserialport.set_protocol(msg.payload);
                        break;
                    case 'set_serialMode':
                        node.yserialport.set_serialMode(msg.payload);
                        break;
                    default:
                        node.warn('unknown command : ' + msg.payload);
                }
            });
        };
    }
    RED.nodes.registerType('yoctopuce-serialport', UseYSerialPort);

};