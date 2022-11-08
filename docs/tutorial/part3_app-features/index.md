
# Application Features

* Working with services on the [server side](https://docs.feathersjs.com/api/services.html) and on the [client side](https://docs.feathersjs.com/api/client.html).
* Using [Hooks](https://docs.feathersjs.com/api/hooks.html) when working with services.
* Creation of **Real-time APIs**.
* **NodeOPCUA** library functions are implemented as two classes [OpcuaServer](https://github.com/bsa-git/feathers-opcua-server/blob/master/src/plugins/opcua/opcua-server.class.js) and [OpcuaClient](https://github.com/bsa-git/feathers-opcua-server/blob/master/src/plugins/opcua/opcua-client.class.js).
* An instances of the class **OpcuaServer** is placed in the service [opcua-servers](https://github.com/bsa-git/feathers-opcua-server/blob/master/src/services/opcua-servers/opcua-servers.class.js) as a list item.
* An instances of the class **OpcuaClient** is placed in the service [opcua-clients](https://github.com/bsa-git/feathers-opcua-server/blob/master/src/services/opcua-clients/opcua-clients.class.js) as a list item.
* **OPC UA** tags are stored in the database **MongoDB** or **neDB**. Operations with tags occur through the service [opcua-tags](https://github.com/bsa-git/feathers-opcua-server/tree/master/src/services/opcua-tags).
* **OPC UA** values are stored in the database **MongoDB** or **neDB**. Operations with values occur through the service [opcua-values](https://github.com/bsa-git/feathers-opcua-server/tree/master/src/services/opcua-values).
* User registration / logging procedure is provided.
* [Authentication](https://docs.feathersjs.com/api/authentication/) process is based on **Express Password** strategies.
* [JWT](https://docs.feathersjs.com/api/authentication/jwt.html) Authentication uses **JSON Web Token**.
* [Local](https://docs.feathersjs.com/api/authentication/local.html) Authentication is used by **Email** and **Password**.
* [OAuth](https://docs.feathersjs.com/api/authentication/oauth.html) 2.0 Authentication via **Google**, **GitHub**.
* The authorization process is based on [feathers-castle](https://feathers-casl.netlify.app/getting-started.html) strategies.
* Provides **Email** validation when registering a user.
* Provides validation when **Email** is changed by the user.
* Provides a procedure for recovering a password forgotten by the user.
* Provides user password change procedure.
* The administrator can manage users: assign roles, divide by groups, change user activity, delete a user.
* Working with the database: [MongoDB](https://github.com/feathersjs-ecosystem/feathers-mongoose) or [neDB](https://github.com/feathersjs-ecosystem/feathers-nedb) through services.
* Site event logging procedure provided.
* Created tests for the server side.

