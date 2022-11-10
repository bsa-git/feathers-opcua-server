
# Configuration

### OPCUA_Config

An application is configured for its host on which it is installed using a configuration file `src\api\opcua\config\OPCUA_Config.json`. In doing so, you can define separate configurations for this host. Each configuration has its own unique number, for example `ua-cherkassy-azot-asutp_dev1` , you can also define the server and client and what tags they will work with. Also in the configuration, you can determine which database to work with and in which mode, which data transfer protection mode to use, and how to authenticate the user.

Main sections of the config file **OPCUA_Config**:

* **id** - unique configuration code.
* **name** - unique configuration name.
* **endpointUrl** - opcua server endpoint url.
* **endpointPort** - opcua server endpoint port.
* **srvServiceUrl** - features framework host url for opcua-servers service.
* **clientServiceUrl** - features framework host url for opcua-clients service.
* **clientScript** - the name of the function to initialize the subscription on the client at startup `src\plugins\opcua\opcua-bootstrap.js`.
* **executeMethodsFrom** - the place where the method should be executed, possible values: `client|server|asyncServer`.
* **hostTypeDB** - the type of database the application will work with, possible values: `(mongodb|nedb)`.
* **opcuaSaveModeToDB** - database operation mode, working or not, local or remote database, updating or adding current `opcua-values`, possible values:  `localUpdate|localAdd|remoteUpdate|remoteAdd|no`.
* **opcuaRemoteDbUrl** - the url of the database where we will store the `opcua-tags` or `opcua-values` data.
* **opcuaBootstrapParams** - parameters at startup of `src\plugins\opcua\opcua-bootstrap.js`.
* **security** - opcua data transfer security settings and user authentication.
* **NodeId** - parameters for the client to receive specific values `NodeId` from the server. e.g. `nodeName`. 
* **include tests** - what tests will we run on this host e.g. `["mssql-tedious.test.js","mssql-datasets.test.js", "http-operations.test.js"]`.
* **paths['base-options']** - base tag paths.
* **paths['options']** - path to tags for a specific configuration, tags that override tag values from base paths.

```bash
[
  ...
  {
    "isEnable": true,
    "id": "ua-cherkassy-azot-asutp_dev1",
    "name": "380-472-00203826-asutp_dev1",
    "description": "Opcua server and client for `azot-m5`, `azot-ogmtmztp` tags from `opc.tcp://M5-0095488.OSTCHEM.COM.UA:26570`",
    "endpointUrl": "opc.tcp://M5-0095488.OSTCHEM.COM.UA:26570",
    "endpointPort": 26570,
    "srvServiceUrl": "http://10.60.0.220:3030",
    "clientServiceUrl": "http://10.60.0.220:3030",
    "clientScript": "startSubscriptionMonitor",
    "executeMethodsFrom": "client",
    "hostTypeDB": "mongodb",
    "opcuaSaveModeToDB": "localUpdate",
    "opcuaRemoteDbUrl": "http://M5-0095488.OSTCHEM.COM.UA:3131",
    "opcuaBootstrapParams": {
      "clearHistoryAtStartup": false,
      "syncHistoryAtStartup": { 
        "active": false,
        "methodName": "methodAcmDayReportsDataGet"
      },
      "syncReportAtStartup": {
        "active": false,
        "methodName": "methodAcmYearReportUpdate"
      }
    },
    "security": {
      "mode": "SignAndEncrypt",
      "policy": "Basic256Sha256",
      "userName": "OPCUA_ADMIN_NAME",
      "password": "OPCUA_ADMIN_PASS"
    },
    "NodeId": {
      "namespaceIndex": 2,
      "identifierType": "displayName",
      "identifierPrefix": "Channel1.Device1",
      "addObjectItem": true
    },
    "include": {
      "tests": [
        "mssql-tedious.test.js",
        "mssql-datasets.test.js",
        "http-operations.test.js"
      ]
    },
    "paths": {
      "base-options": [
        "/src/api/opcua/tags/ua-cherkassy-azot-m5_prod1",
        "/src/api/opcua/tags/ua-cherkassy-azot-ogmtmztp_prod1"
      ],
      "options": "/src/api/opcua/tags/ua-cherkassy-azot-asutp_dev1/AddressSpaceOptions.json",
      "getters": "",
      "methods": "",
      "subscriptions": "",
      "client-scripts": ""
    }
  }
  ...
]
```

### @feathersjs/configuration

It is a wrapper for [node-config](https://github.com/lorenwest/node-config)  which allows to configure a server side Feathers application.

By default this implementation will look in `config/*` for `default.json` which retains convention. It will be merged with other configuration files in the `config/` folder using the **NODE_ENV** environment variable. So setting **NODE_ENV=production** will merge `config/default.json` with `config/production.json`.

As per the [config docs](https://github.com/lorenwest/node-config/wiki/Configuration-Files) you can organize *"hierarchical configurations for your app deployments"*.

### .env

The `.env` file must be located at the root of the project, if it is missing, then it must be created based on the example file `.env.example`, otherwise the application will throw an **error**. The `.env` file sets environment variables. Environment variables usually contain user secrets, such as **user_id**, **user_secret**, etc.

Example for **.env.example**.

```bash
### SERVER ###
#-------------#
HOST="localhost"
PORT=3030
BASE_URL="http://localhost:3030"

...

### AUTH ###
#----------#
# External accounts to login
EXTERNAL_ACCOUNTS="google;github"
# yes | no; true | false; 1 | 0
MY_LOCALHOST_TO_IP=0
# yes | no; true | false; 1 | 0
IS_AUTH_MANAGER=0

# yes | no; true | false; 1 | 0
SET_USER_ACTIVE=1

...

### OPC-UA ###
#------------#
# localUpdate|localAdd|remoteUpdate|remoteAdd|no
DEFAULT_OPCUA_SAVEMODE_TODB="no"
# client|server|asyncServer
DEFAULT_EXECUTE_METHODS_FROM="client"
# http://localhost:3131
DEFAULT_OPCUA_REMOTE_DB_URL="http://localhost:3131"
# yes | no; true | false; 1 | 0
OPCUA_BOOTSTRAP_ENABLE=1
# -1(no limits) | 1..n(n limit)
OPCUA_VALUES_MAXROWS=10
# AuthenticatedUser, Supervisor, Administrator
OPCUA_USER_NAME="xxxxxxxxxxxxxx"
OPCUA_USER_PASS="xxxxxxxxxxxxxx"
OPCUA_ADMIN_NAME="xxxxxxxxxxxxxx"
OPCUA_ADMIN_PASS="xxxxxxxxxxxxxx"
OPCUA_KEP_NAME="xxxxxxxxxxxxxx"
OPCUA_KEP_PASS="xxxxxxxxxxxxxx"

### LOG ###
#----------#
# yes | no; true | false; 1 | 0
LOGMSG_ENABLE=1
# -1(no limits) | 1..n(n limit)
LOGMSG_MAXROWS=100

### SECRET DATA ###
#-----------------#
GITHUB_ID="xxxxxxxxxxxxxxxxxxxxxxxx"
GITHUB_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

GOOGLE_ID="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com"
GOOGLE_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxx"

### DATA-BASE ###
#-----------------#

# MSSQL
MSSQL_ASODU_TEST_ID="OGMT-MZTP.FIRST.dbBSA"
MSSQL_ASODU_TEST_USER="xxxxxxxxxxxxxxx"
MSSQL_ASODU_TEST_PASS="xxxxxxxxxxxxxxx"

MSSQL_BSAHOME_TEST_ID="BSA-HOME.SQLEXPRESS.Feathers_test"
MSSQL_BSAHOME_TEST_USER="xxxx"
MSSQL_BSAHOME_TEST_PASS="xxxxxxxxxxxxx"

# DEFAULT TYPE DB (mongodb | nedb)
DEFAULT_TYPE_DB="nedb"

# MONGODB
MONGODB_DEV_URL="mongodb://localhost:27017/feathers_opcua_devserver"
MONGODB_TEST_URL="mongodb://localhost:27017/feathers_opcua_testserver"
MONGODB_PROD_URL="mongodb://localhost:27017/feathers_opcua_prodserver"

# NEDB
NEDB_DEV_PATH="nedb://../data/nedb/dev"
NEDB_TEST_PATH="nedb://../data/nedb/test"
NEDB_PROD_PATH="nedb://../data/nedb/prod"
```

>   Note: To have real keys to access the API of various services, you need to register your application in these services. Examples of registering an application and obtaining API keys in different services can be found [here](https://github.com/sahat/hackathon-starter#obtaining-api-keys).

Main sections of the environment variable file **.env**:

* **SERVER** - used in configuration files `\config\default.json`, `\config\development.json`, `\config\production.json`, `\config\test.json`.
* **AUTH** - used to authenticate and authorize users to access application resources.
* **OPC-UA** - used to set the parameters of the library NodeOPCUA.
* **LOG** - used for logging events.
* **SECRET DATA** - secret data for services (GOOGLE, GITHUB).
* **DATA-BASE** - database information (MSSQL, MONGODB, NEDB).

### feathers-specs

This configuration file is located in the folder `\config\feathers-specs.json`.
Main sections of **feathers-specs**:

* **envTestModeName** - the value is set to a variable `NODE_ENV` for the test mode.
```bash
{
  "app": {
    "envTestModeName": "test",
    ...
  },
  ...
}
```
* **envAllowingSeedData** - modes for which it is allowed to change data in the database with `\seeds\fake-data.json`.
```bash
{
  "app": {
    ...
    "envAllowingSeedData": ["test"],
    ...
  },
  ...
}
```
* **providers** - transport types used to transfer data.
```bash
{
  "app": {
    ...
    "providers": [
      "rest",
      "socketio"
    ]
    ...
  },
  ...
}
```
* **services** - service properties such as name, path, etc.
```bash
{
  "services": {
    "users": {
      "name": "users",
      "nameSingular": "user",
      "subFolder": "",
      "fileName": "users",
      "adapter": "nedb",
      "path": "/users",
      "isAuthEntity": true,
      "requiresAuth": true,
      "overriddenAuth": {
        "create": "noauth",
        "get": "auth",
        "find": "auth",
        "update": "auth",
        "patch": "auth",
        "remove": "auth"
      }
    },
  },
  ...
}
```
* **hooks** - hook properties such as fileName, ifMulti, etc.
```bash
{
  "hooks": {
    "normalize": {
      "fileName": "normalize",
      "camelName": "normalize",
      "ifMulti": "y",
      "multiServices": [
        "*app"
      ],
      "singleService": ""
    },
    ...
  },
  ...
}
```
