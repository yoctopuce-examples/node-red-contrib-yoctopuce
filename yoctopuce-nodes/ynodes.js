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
                node.log("function ready...");
                let yfun;
                if (node.hwid) {
                    yfun = YFunction.FindFunctionInContext(node.yctx, node.hwid);
                } else {
                    yfun = YFunction.FirstFunctionInContext(node.yctx);
                }
                node.setupFunNodeSate(yfun, true);

            };

            node.updateDevList = function (serial, plug) {
                // by default use any connected module suitable for the demo
                if (node.serialNumber === serial) {
                    if (plug) {
                        node.status({fill: "green", shape: "dot", text: "running"});
                    } else {
                        node.status({fill: "yellow", shape: "dot", text: "running"});
                    }
                }

            };
            this.setupFunNodeSate = async function (yfun, registerCb) {
                if (!yfun) {
                    node.warn("No function connected on " + node.yoctohub.hostname);
                    return;
                }
                node.status({fill: "yellow", shape: "dot", text: "running"});
                node.log("use  " + node.hwid + " on " + node.yoctohub.hostname);
                node.yfun = yfun;
                node.yfun.isOnline().then(async (isonline) => {
                    if (!isonline) {
                        node.warn("No function " + node.hwid + " connected on " + node.yoctohub.hostname);
                        return;
                    }
                    if (registerCb) {
                        node.yfun.registerValueCallback(function (obj_fct, str_value) {
                            let topic = getUsefullTopic(node);
                            let msg = {payload: str_value, topic: topic};
                            node.send(msg);
                        });
                    }
                    let module = await node.yfun.get_module();
                    node.serialNumber = await module.get_serialNumber();
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

    let getUsefullTopic = function (node) {
        let topic;
        if (node.name) {
            topic = node.name;
        } else {
            topic = node.hwid;
        }
        return topic;
    };

    function UseYSensor(config)
    {
        UseYFunction.call(this, config);
        this.useTimeNot = config.useTimeNot;
        this.reportFrequency = config.reportFrequency;
        if (typeof this.reportFrequency === 'undefined') {
            this.reportFrequency = '30/s';
        }
        this.report_type = config.report_type;
        if (typeof this.report_type === 'undefined') {
            this.report_type = 'avg';
        }
        var node = this;

        this.onYoctHubReady = async function () {
            let sensor;
            node.log("sensor ready...");
            //node.timeoffset = new Date().getTimezoneOffset();
            //node.log(node.timeoffset);
            if (node.hwid) {
                sensor = YSensor.FindSensorInContext(node.yctx, node.hwid);
            } else {
                sensor = YSensor.FirstSensorInContext(node.yctx);
            }
            if (node.useTimeNot) {
                node.setupFunNodeSate(sensor, false);
                await sensor.set_reportFrequency(node.reportFrequency);
                await sensor.registerTimedReportCallback(function (func, ymeasure) {
                    let payload;

                    let avg = ymeasure.get_averageValue();
                    let min = ymeasure.get_minValue();
                    let max = ymeasure.get_maxValue();
                    let start = ymeasure.get_startTimeUTC() * 1000;
                    let stop = ymeasure.get_endTimeUTC() * 1000;
                    switch (node.report_type) {
                        case 'avg':
                            payload = avg;
                            break;
                        case 'min':
                            payload = min;
                            break;
                        case 'max':
                            payload = max;
                            break;
                        case 'all':
                            payload = {start: start, stop: stop, min: min, max: max, avg: avg};
                            break;
                    }
                    let topic = getUsefullTopic(node);
                    let msg = {payload: payload, topic: topic, timestamp: stop};
                    node.send(msg);
                })
            } else {
                node.setupFunNodeSate(sensor, true);
            }
        };

    }

    RED.nodes.registerType("YFunction", UseYFunction);
    RED.nodes.registerType("YSensor", UseYSensor);


//--- (generated code: YBuzzer class start)
    require('yoctolib-es2017/yocto_buzzer.js');

    function UseYBuzzer(config)
    {
        UseYFunction.call(this, config);
        this.ybuzzer = null;
        this.command = config.command;
//--- (end of generated code: YBuzzer class start)

//--- (generated code: YBuzzer implementation)
        var node = this;
        this.onYoctHubReady = async function () {
            // by default use any connected module suitable for the demo
            let buzzer;
            if (node.hwid) {
                buzzer = YBuzzer.FindBuzzerInContext(node.yctx, node.hwid);
            } else {
                buzzer = YBuzzer.FirstBuzzerInContext(node.yctx);
            }
            node.setupFunNodeSate(buzzer, false);
            node.ybuzzer = buzzer;
//--- (end of generated code: YBuzzer implementation)
            node.on('input', async function (msg) {
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
//--- (generated code: YBuzzer cleanup)
        };
    }

    RED.nodes.registerType('YBuzzer', UseYBuzzer);
//--- (end of generated code: YBuzzer cleanup)


//--- (generated code: YColorLed class start)
    require('yoctolib-es2017/yocto_colorled.js');

    function UseYColorLed(config)
    {
        UseYFunction.call(this, config);
        this.ycolorled = null;
        this.command = config.command;
//--- (end of generated code: YColorLed class start)
        this.msdelay = config.msdelay;
//--- (generated code: YColorLed implementation)
        var node = this;
        this.onYoctHubReady = async function () {
            // by default use any connected module suitable for the demo
            let colorled;
            if (node.hwid) {
                colorled = YColorLed.FindColorLedInContext(node.yctx, node.hwid);
            } else {
                colorled = YColorLed.FirstColorLedInContext(node.yctx);
            }
            node.setupFunNodeSate(colorled, false);
            node.ycolorled = colorled;
//--- (end of generated code: YColorLed implementation)
            node.on('input', async function (msg) {
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
//--- (generated code: YColorLed cleanup)
        };
    }

    RED.nodes.registerType('YColorLed', UseYColorLed);
//--- (end of generated code: YColorLed cleanup)


//--- (generated code: YColorLedCluster class start)
    require('yoctolib-es2017/yocto_colorledcluster.js');

    function UseYColorLedCluster(config)
    {
        UseYFunction.call(this, config);
        this.ycolorledcluster = null;
        this.command = config.command;
//--- (end of generated code: YColorLedCluster class start)

//--- (generated code: YColorLedCluster implementation)
        var node = this;
        this.onYoctHubReady = async function () {
            // by default use any connected module suitable for the demo
            let colorledcluster;
            if (node.hwid) {
                colorledcluster = YColorLedCluster.FindColorLedClusterInContext(node.yctx, node.hwid);
            } else {
                colorledcluster = YColorLedCluster.FirstColorLedClusterInContext(node.yctx);
            }
            node.setupFunNodeSate(colorledcluster, false);
            node.ycolorledcluster = colorledcluster;
//--- (end of generated code: YColorLedCluster implementation)
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
//--- (generated code: YColorLedCluster cleanup)
        };
    }

    RED.nodes.registerType('YColorLedCluster', UseYColorLedCluster);
//--- (end of generated code: YColorLedCluster cleanup)

//--- (generated code: YCurrentLoopOutput class start)
    require('yoctolib-es2017/yocto_currentloopoutput.js');

    function UseYCurrentLoopOutput(config)
    {
        UseYFunction.call(this, config);
        this.ycurrentloopoutput = null;
        this.command = config.command;
//--- (end of generated code: YCurrentLoopOutput class start)
//--- (generated code: YCurrentLoopOutput implementation)
        var node = this;
        this.onYoctHubReady = async function () {
            // by default use any connected module suitable for the demo
            let currentloopoutput;
            if (node.hwid) {
                currentloopoutput = YCurrentLoopOutput.FindCurrentLoopOutputInContext(node.yctx, node.hwid);
            } else {
                currentloopoutput = YCurrentLoopOutput.FirstCurrentLoopOutputInContext(node.yctx);
            }
            node.setupFunNodeSate(currentloopoutput, false);
            node.ycurrentloopoutput = currentloopoutput;
//--- (end of generated code: YCurrentLoopOutput implementation)
            node.on('input', async function (msg) {
                switch (node.command) {
                    case 'set_current':
                        node.ycurrentloopoutput.set_current(msg.payload);
                        break;

                    default:
                        node.warn('unknown command : ' + msg.payload);
                }
            });
//--- (generated code: YCurrentLoopOutput cleanup)
        };
    }

    RED.nodes.registerType('YCurrentLoopOutput', UseYCurrentLoopOutput);
//--- (end of generated code: YCurrentLoopOutput cleanup)


//--- (generated code: YDigitalIO class start)
    require('yoctolib-es2017/yocto_digitalio.js');

    function UseYDigitalIO(config)
    {
        UseYFunction.call(this, config);
        this.ydigitalio = null;
        this.command = config.command;
//--- (end of generated code: YDigitalIO class start)

//--- (generated code: YDigitalIO implementation)
        var node = this;
        this.onYoctHubReady = async function () {
            // by default use any connected module suitable for the demo
            let digitalio;
            if (node.hwid) {
                digitalio = YDigitalIO.FindDigitalIOInContext(node.yctx, node.hwid);
            } else {
                digitalio = YDigitalIO.FirstDigitalIOInContext(node.yctx);
            }
            node.setupFunNodeSate(digitalio, false);
            node.ydigitalio = digitalio;
//--- (end of generated code: YDigitalIO implementation)
            node.on('input', async function (msg) {
                switch (node.command) {
                    case 'set_portState':
                        node.ydigitalio.set_portState(msg.payload);
                        break;
                    default:
                        node.warn('unknown command : ' + msg.payload);
                }
            });
//--- (generated code: YDigitalIO cleanup)
        };
    }

    RED.nodes.registerType('YDigitalIO', UseYDigitalIO);
//--- (end of generated code: YDigitalIO cleanup)


//--- (generated code: YDisplay class start)
    require('yoctolib-es2017/yocto_display.js');

    function UseYDisplay(config)
    {
        UseYFunction.call(this, config);
        this.ydisplay = null;
        this.command = config.command;
//--- (end of generated code: YDisplay class start)
        this.font = config.font;
        this.w = 0;
        this.h = 0;
        this.layer2 = null;
//--- (generated code: YDisplay implementation)
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
//--- (end of generated code: YDisplay implementation)
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
                        await node.layer2.drawText(node.w / 2, node.h / 2, node.layer2.ALIGN_CENTER, msg.payload);
                        await node.ydisplay.swapLayerContent(2, 3);
                        break;
                    case 'playSequence':
                        node.ydisplay.playSequence(msg.payload);
                        break;
                    default:
                        node.warn('unknown command : ' + msg.payload);
                }
            });
//--- (generated code: YDisplay cleanup)
        };
    }

    RED.nodes.registerType('YDisplay', UseYDisplay);
//--- (end of generated code: YDisplay cleanup)


//--- (generated code: YLed class start)
    require('yoctolib-es2017/yocto_led.js');

    function UseYLed(config)
    {
        UseYFunction.call(this, config);
        this.yled = null;
        this.command = config.command;
//--- (end of generated code: YLed class start)
//--- (generated code: YLed implementation)
        var node = this;
        this.onYoctHubReady = async function () {
            // by default use any connected module suitable for the demo
            let led;
            if (node.hwid) {
                led = YLed.FindLedInContext(node.yctx, node.hwid);
            } else {
                led = YLed.FirstLedInContext(node.yctx);
            }
            node.setupFunNodeSate(led, false);
            node.yled = led;
//--- (end of generated code: YLed implementation)
            node.on('input', async function (msg) {
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
//--- (generated code: YLed cleanup)
        };
    }

    RED.nodes.registerType('YLed', UseYLed);
//--- (end of generated code: YLed cleanup)

//--- (generated code: YPwmOutput class start)
    require('yoctolib-es2017/yocto_pwmoutput.js');

    function UseYPwmOutput(config)
    {
        UseYFunction.call(this, config);
        this.ypwmoutput = null;
        this.command = config.command;
//--- (end of generated code: YPwmOutput class start)
//--- (generated code: YPwmOutput implementation)
        var node = this;
        this.onYoctHubReady = async function () {
            // by default use any connected module suitable for the demo
            let pwmoutput;
            if (node.hwid) {
                pwmoutput = YPwmOutput.FindPwmOutputInContext(node.yctx, node.hwid);
            } else {
                pwmoutput = YPwmOutput.FirstPwmOutputInContext(node.yctx);
            }
            node.setupFunNodeSate(pwmoutput, false);
            node.ypwmoutput = pwmoutput;
//--- (end of generated code: YPwmOutput implementation)
            node.on('input', async function (msg) {
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
//--- (generated code: YPwmOutput cleanup)
        };
    }

    RED.nodes.registerType('YPwmOutput', UseYPwmOutput);
//--- (end of generated code: YPwmOutput cleanup)

//--- (generated code: YRelay class start)
    require('yoctolib-es2017/yocto_relay.js');

    function UseYRelay(config)
    {
        UseYFunction.call(this, config);
        this.yrelay = null;
        this.command = config.command;
//--- (end of generated code: YRelay class start)
//--- (generated code: YRelay implementation)
        var node = this;
        this.onYoctHubReady = async function () {
            // by default use any connected module suitable for the demo
            let relay;
            if (node.hwid) {
                relay = YRelay.FindRelayInContext(node.yctx, node.hwid);
            } else {
                relay = YRelay.FirstRelayInContext(node.yctx);
            }
            node.setupFunNodeSate(relay, false);
            node.yrelay = relay;
//--- (end of generated code: YRelay implementation)
            node.on('input', async function (msg) {
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
//--- (generated code: YRelay cleanup)
        };
    }

    RED.nodes.registerType('YRelay', UseYRelay);
//--- (end of generated code: YRelay cleanup)


//--- (generated code: YSerialPort class start)
    require('yoctolib-es2017/yocto_serialport.js');

    function UseYSerialPort(config)
    {
        UseYFunction.call(this, config);
        this.yserialport = null;
        this.command = config.command;
//--- (end of generated code: YSerialPort class start)

//--- (generated code: YSerialPort implementation)
        var node = this;
        this.onYoctHubReady = async function () {
            // by default use any connected module suitable for the demo
            let serialport;
            if (node.hwid) {
                serialport = YSerialPort.FindSerialPortInContext(node.yctx, node.hwid);
            } else {
                serialport = YSerialPort.FirstSerialPortInContext(node.yctx);
            }
            node.setupFunNodeSate(serialport, false);
            node.yserialport = serialport;
//--- (end of generated code: YSerialPort implementation)
            node.on('input', async function (msg) {
                switch (node.command) {
                    case 'writeByte':
                        node.yserialport.writeByte(msg.payload);
                        break;
                    case 'writeStr':
                        node.yserialport.writeStr(msg.payload);
                        break;
                    case 'writeBin':
                        node.yserialport.writeBin(msg.payload);
                        break;
                    case 'writeHex':
                        node.yserialport.writeHex(msg.payload);
                        break;
                    case 'writeLine':
                        node.yserialport.writeLine(msg.payload);
                        break;
                    case 'writeMODBUS':
                        node.yserialport.writeMODBUS(msg.payload);
                        break;
                    default:
                        node.warn('unknown command : ' + node.command);
                }
            });
//--- (generated code: YSerialPort cleanup)
        };
    }

    RED.nodes.registerType('YSerialPort', UseYSerialPort);
//--- (end of generated code: YSerialPort cleanup)


//--- (generated code: YServo class start)
    require('yoctolib-es2017/yocto_servo.js');

    function UseYServo(config)
    {
        UseYFunction.call(this, config);
        this.yservo = null;
        this.command = config.command;
//--- (end of generated code: YServo class start)
        this.msdelay = config.msdelay;

//--- (generated code: YServo implementation)
        var node = this;
        this.onYoctHubReady = async function () {
            // by default use any connected module suitable for the demo
            let servo;
            if (node.hwid) {
                servo = YServo.FindServoInContext(node.yctx, node.hwid);
            } else {
                servo = YServo.FirstServoInContext(node.yctx);
            }
            node.setupFunNodeSate(servo, false);
            node.yservo = servo;
//--- (end of generated code: YServo implementation)
            node.on('input', async function (msg) {
                if (node.msdelay > 0) {
                    node.yservo.move(msg.payload, node.msdelay);
                } else {
                    node.yservo.set_position(msg.payload);
                }
            });
//--- (generated code: YServo cleanup)
        };
    }

    RED.nodes.registerType('YServo', UseYServo);
//--- (end of generated code: YServo cleanup)


//--- (generated code: YSpiPort class start)
    require('yoctolib-es2017/yocto_spiport.js');

    function UseYSpiPort(config)
    {
        UseYFunction.call(this, config);
        this.yspiport = null;
        this.command = config.command;
//--- (end of generated code: YSpiPort class start)

//--- (generated code: YSpiPort implementation)
        var node = this;
        this.onYoctHubReady = async function () {
            // by default use any connected module suitable for the demo
            let spiport;
            if (node.hwid) {
                spiport = YSpiPort.FindSpiPortInContext(node.yctx, node.hwid);
            } else {
                spiport = YSpiPort.FirstSpiPortInContext(node.yctx);
            }
            node.setupFunNodeSate(spiport, false);
            node.yspiport = spiport;
//--- (end of generated code: YSpiPort implementation)
            node.on('input', async function (msg) {
                switch (node.command) {
                    case 'reset':
                        node.yspiport.reset();
                        break;
                    case 'writeByte':
                        node.yspiport.writeByte(msg.payload);
                        break;
                    case 'writeStr':
                        node.yspiport.writeStr(msg.payload);
                        break;
                    case 'writeBin':
                        node.yspiport.writeBin(msg.payload);
                        break;
                    case 'writeArray':
                        node.yspiport.writeArray(msg.payload);
                        break;
                    case 'writeHex':
                        node.yspiport.writeHex(msg.payload);
                        break;
                    case 'writeLine':
                        node.yspiport.writeLine(msg.payload);
                        break;
                    default:
                        node.warn('unknown command : ' + node.command);
                }
            });
//--- (generated code: YSpiPort cleanup)
        };
    }

    RED.nodes.registerType('YSpiPort', UseYSpiPort);
//--- (end of generated code: YSpiPort cleanup)


//--- (generated code: YVoltageOutput class start)
    require('yoctolib-es2017/yocto_voltageoutput.js');

    function UseYVoltageOutput(config)
    {
        UseYFunction.call(this, config);
        this.yvoltageoutput = null;
        this.command = config.command;
//--- (end of generated code: YVoltageOutput class start)
        this.msdelay = config.msdelay;

//--- (generated code: YVoltageOutput implementation)
        var node = this;
        this.onYoctHubReady = async function () {
            // by default use any connected module suitable for the demo
            let voltageoutput;
            if (node.hwid) {
                voltageoutput = YVoltageOutput.FindVoltageOutputInContext(node.yctx, node.hwid);
            } else {
                voltageoutput = YVoltageOutput.FirstVoltageOutputInContext(node.yctx);
            }
            node.setupFunNodeSate(voltageoutput, false);
            node.yvoltageoutput = voltageoutput;
//--- (end of generated code: YVoltageOutput implementation)
            node.on('input', async function (msg) {
                if (node.msdelay > 0) {
                    node.yvoltageoutput.voltageMove(msg.payload, node.msdelay)
                } else {
                    node.yvoltageoutput.set_currentVoltage(msg.payload);
                }
            });
//--- (generated code: YVoltageOutput cleanup)
        };
    }

    RED.nodes.registerType('YVoltageOutput', UseYVoltageOutput);
//--- (end of generated code: YVoltageOutput cleanup)


//--- (generated code: YWatchdog class start)
    require('yoctolib-es2017/yocto_watchdog.js');

    function UseYWatchdog(config)
    {
        UseYFunction.call(this, config);
        this.ywatchdog = null;
        this.command = config.command;
//--- (end of generated code: YWatchdog class start)

//--- (generated code: YWatchdog implementation)
        var node = this;
        this.onYoctHubReady = async function () {
            // by default use any connected module suitable for the demo
            let watchdog;
            if (node.hwid) {
                watchdog = YWatchdog.FindWatchdogInContext(node.yctx, node.hwid);
            } else {
                watchdog = YWatchdog.FirstWatchdogInContext(node.yctx);
            }
            node.setupFunNodeSate(watchdog, false);
            node.ywatchdog = watchdog;
//--- (end of generated code: YWatchdog implementation)
            node.on('input', async function (msg) {
                let val = msg.payload;
                switch (node.command) {
                    case 'set_state':
                        if (typeof val === "string") {
                            val = val.toLowerCase();
                            if (val === 'b') {
                                val = YWatchdog.STATE_B;
                            } else {
                                val = YWatchdog.STATE_A;
                            }
                        }
                        node.ywatchdog.set_state(val);
                        break;
                    case 'set_output':
                        if (typeof val === "string") {
                            val = val.toLowerCase();
                            if (val === 'on') {
                                val = YWatchdog.OUTPUT_ON;
                            } else {
                                val = YWatchdog.OUTPUT_OFF;
                            }
                        }
                        node.ywatchdog.set_output(val);
                        break;
                    case 'pulse':
                        node.ywatchdog.pulse(msg.payload);
                        break;
                    case 'set_running':
                        if (typeof val === "string") {
                            val = val.toLowerCase();
                            if (val === 'on') {
                                val = YWatchdog.RUNNING_ON;
                            } else {
                                val = YWatchdog.RUNNING_OFF;
                            }
                        }
                        node.ywatchdog.set_output(val);
                        break;
                    case 'resetWatchdog':
                        node.ywatchdog.resetWatchdog();
                        break;
                    default:
                        node.warn('unknown command : ' + node.command);
                }
            });
//--- (generated code: YWatchdog cleanup)
        };
    }

    RED.nodes.registerType('YWatchdog', UseYWatchdog);
//--- (end of generated code: YWatchdog cleanup)


};
