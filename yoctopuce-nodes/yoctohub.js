module.exports = function (RED) {
    "use strict";
    require('yoctolib-es2017/yocto_api.js');


    async function handleHotPlug(yctx)
    {
        //console.log("update device list for "+yctx._uniqueID);
        await yctx.UpdateDeviceList();
        setTimeout(handleHotPlug,1000, yctx);
    }

    function RemoteServerNode(config)
    {
        RED.nodes.createNode(this, config);
        this.hostname = config.hostname;
        this.port = config.port;
        if (this.credentials) {
            this.username = this.credentials.user;
            this.password = this.credentials.password;
        } else {
            this.username = null;
            this.password = null;
        }
        if (this.username) {
            this.huburl = this.username + ":" + this.password + "@" + this.hostname + ":" + this.port.toString();
        } else {
            this.huburl = this.hostname + ":" + this.port.toString();
        }
        this.yctx = new YAPIContext();
        this.yapi_up = false;

        var node = this;
        this.users = {};


        this.register = function (clientNode) {
            node.log("register node id " + clientNode.id + " (" + clientNode.hwid + ")");
            node.users[clientNode.id] = clientNode;
            let length = Object.keys(node.users).length;
            if (length === 1) {
                node.connect();
            }
        };

        this.deregister = function (clientNode, done) {
            node.log("unregister node id " + clientNode.id + " (" + clientNode.hwid + ")");
            delete node.users[clientNode.id];
            if (node.closing) {
                return done();
            }
            if (Object.keys(node.users).length === 0) {
                if (node.client && node.client.connected) {
                    return node.client.end(done);
                } else {
                    node.client.end();
                    return done();
                }
            }
            done();
        };



        this.connect = async function () {
            let version = YAPI.imm_GetAPIVersion();
            node.log("Use YoctoLib " + version);
            node.log("connect to " + node.hostname);
            let errmsg = new YErrorMsg();
            node.yctx.LogUnhandledPromiseRejections().then(() => {
                return node.yctx.DisableExceptions();
            }).then(() => {
                // Setup the API to use the VirtualHub on local machine
                node.log("Register hub with url " + node.huburl);
                return node.yctx.RegisterHub(node.huburl, errmsg);
            }).then((res) => {
                if (res !== YAPI.SUCCESS) {
                    node.error('Cannot contact ' + node.huburl + ': ' + errmsg.msg);
                    return;
                }
                node.log("YoctoHub " + node.hostname + " up and running");
                for (let id in node.users) {
                    if (node.users.hasOwnProperty(id)) {
                        node.log("update node id " + id + " (" + node.users[id].hwid + ")");
                        node.users[id].onYoctHubReady();
                    }
                }
                node.yapi_up = true;
            });
            await node.yctx.RegisterDeviceArrivalCallback(async function (module) {
                let serialNumber = await module.get_serialNumber();
                //node.log("device arrival:"+serialNumber);
                for (let id in node.users) {
                    if (node.users[id]) {
                        node.users[id].updateDevList(serialNumber, true);
                    }
                }
            });
            await node.yctx.RegisterDeviceRemovalCallback(async function (module) {
                let serialNumber = await module.get_serialNumber();
                //node.log("device removal:"+serialNumber);
                for (let id in node.users) {
                    if (node.users[id]) {
                        node.users[id].updateDevList(serialNumber, false);
                    }
                }
            });

            setTimeout(handleHotPlug, 5000, node.yctx);


            node.on("close", function (done) {
                node.yapi_up = false;
                node.log("disconnected from " + node.hostname);
                node.yctx.FreeAPI().then(() => {
                    node.status({});
                    done();
                });

            });
        }
    }

    RED.nodes.registerType("yoctohub", RemoteServerNode, {
        credentials: {
            user: {type: "text"},
            password: {type: "password"}
        }
    });

}