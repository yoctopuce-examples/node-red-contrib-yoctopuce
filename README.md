node-red-contrib-yoctopuce
==================================
A Node-RED node to interact with Yoctopuce Sensors.

Install
-----------

You can install this node directly from the "Manage Palette" menu in the Node-RED interface. There are no external 
dependencies or compilation steps.

Alternatively, run the following command in your Node-RED user directory - typically `~/.node-red` on Linux 
or `%HOMEPATH%\.nodered` on Windows

        npm install node-red-contrib-yoctopuce

Usage
-----------

All node has at least three parameters :

* **YoctoHub**: the YoctoHub configuration where the Yoctopuce device is connected (see bellow)
* **Hardware ID**: the hardware id of the Yoctopuce function.The Hardware ID can be specified using several formats:
    * FunctionLogicalName
    * ModuleSerialNumber.FunctionIdentifier
    * ModuleSerialNumber.FunctionLogicalName
    * ModuleLogicalName.FunctionIdentifier
    * ModuleLogicalName.FunctionLogicalName
* **Name** (optional): the name of this Node-RED node.


The **YoctoHub** configuration has 4 parameters:

* **YoctoHub Hostname**: the hostname or the IP address of the VirtualHub or YoctoHub where the YSensor is connected.
* **YoctoHub Port**: the port used by the VirtualHub or YoctoHub (usually 4444).
* **YoctoHub Username** (optional): the username to access the VirtualHub or YoctoHub.
* **YoctoHub Password** (optional): the password to access the VirtualHub or YoctoHub.
