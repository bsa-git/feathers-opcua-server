
# Introduction.

The application **FEATHERS-OPCUA-SERVER** is designed to implement the use of the library
[NodeOPCUA](https://node-opcua.github.io/) .  

**NodeOPCUA** is a [OPC UA](https://opcfoundation.org/faq/what-is-opc-ua/) stack fully written in [TypeScript](https://www.typescriptlang.org/) for [NodeJS](http://nodejs.org/). Basic properties:

* **NodeOPCUA** takes advantage of the asynchronous nature of node.js, creating highly responsive applications.
* **NodeOPCUA** has been developed using [TDD](https://en.wikipedia.org/wiki/Test_Driven_Development) and benefits from more than 2500 unit tests and 90% code coverage.
* **NodeOPCUA** can be use in Javascript as well as in Typescript.
* **NodeOPCUA** is free for commercial use. Check out the [license](https://raw.githubusercontent.com/node-opcua/node-opcua/master/LICENSE).
* **NodeOPCUA** is available on GitHub . Check out the [source code](https://github.com/node-opcua/node-opcua).
* **NodeOPCUA** runs on all the platforms that nodeJS supports.
* **NodeOPCUA** will benefit from a [comprehensive SDK API documentation](https://node-opcua.github.io/api_doc/index.html), numerous end-to-end functional tests, and a set of practical examples to help you learn how to use it.

### Distributed data collection system

An application is configured for its host on which it is installed using a configuration file `src\api\opcua\config\OPCUA_Config.json`. In doing so, you can define separate configurations for this host. Each configuration has its own unique `id`, for example `ua-cherkassy-azot-asutp_dev1` , you can also define the server and client and what tags they will work with. Also in the configuration, you can determine which database to work with and in which mode, which data transfer protection mode to use, and how to authenticate the user. Details can be found [here](/feathers-opcua-server/tutorial/part6_configuration/#opcua-config).

### Why do you need a framework.

There was an idea to embed the implementation of the library **NodeOPCUA** in the framework in order to use the features of this framework, such as:

* Working with databases.
* Access to data through protocols **REST API** and **Websockets**.
* Users authentication mechanisms.
* Create a client application and display **OPC UA** data in the client application.

### Why the framework [FeathersJS](https://docs.feathersjs.com/) was chosen.

**FeathersJS** is a set of tools and an architecture template that makes it easy to build scalable real-time REST APIs. Comparison with other frameworks can be found [here](https://feathersjs.com/comparison).

The main idea of the **FeathersJS framework** is to move away from the **MVC** concept and use the concept of working with **services** and **hooks**. This made it possible to create a structure that can grow with you as your product grows. It's flexible enough to quickly adapt to changing business needs, powerful enough to build modern applications, and simple enough to build and run quickly.

Here is an overview of the API documentation fit together:

<img alt="Feathers architecture overview" src="Feathers architecture-overview.svg" style="width:75%;">


