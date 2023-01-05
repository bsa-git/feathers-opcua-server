## Install a node application as a Windows service

There is a [NPM package node-windows](https://github.com/coreybutler/node-windows) which can install a node application as a Windows service. This service can be automatically started when the server restarts. The `node-windows` can do this for us. Run the following commands:

```sh
npm install -g node-windows
```
Then, in your project root, run:

```sh
npm link node-windows
```

Once the package is installed it can be used to install the application as a service with the following node script:

*scripts/cli/install-windows.service.js*
```js
const { cwd } = require('process');
const appRoot = cwd();
const { join } = require('path');
const filePath = join(appRoot, 'src\\index.js');
const Service = require('node-windows').Service;

// Create a new service object
const svc = new Service({
  name: 'Feathers opcua server',
  description: 'Feathers opcua server application as Windows Service',
  script: filePath,
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ],
  env: [{
    name: 'NODE_ENV',
    value: 'production' // env NODE_ENV = 'production'
  },
  {
    name: 'IS_SHOW_LOG', 
    value: false // env IS_SHOW_LOG = true|false; Is show log for production
  },
  {
    name: 'START_APP',
    value: 'win_service' // env START_APP = 'win_service'; Start application as windows service
  },
  
  ]
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function () {
  svc.start();
  console.log('Install complete.');
});

// Error - Fired in some instances when an error occurs.
svc.on('error', function (err) {
  console.log('feathers-opcua-server.Error:', err);
});

svc.install();
```

Just run the script as any other node script:

```sh
node install-windows-service.js
```

If User Account Control (UAC) is enabled on Windows you will have to give permission a few times to complete the installation. Once this script has finished the service is installed and the application is running. You can find the service in the `Services` dialog. It will have the name that you have passed to the `Service` class in the node script.

<img alt="Services dialog with the newly installed Windows service" src="https://eysermans.com/images/articles/installing-a-node-application-as-a-windows-service/services.png" style="width:75%;">

If the service ever needs to be uninstalled, the Service class also has an uninstall method:

*scripts/cli/uninstall-windows.service.js*
```js
const { cwd } = require('process');
const appRoot = cwd();
const { join } = require('path');
const filePath = join(appRoot, 'src\\index.js');
const Service = require('node-windows').Service;

// Create a new service object
const svc = new Service({
  name: 'Feathers opcua server',
  description: 'Feathers opcua server application as Windows Service',
  script: filePath
});

// Listen for the "uninstall" event so we know when it's done.
svc.on('uninstall', function () {
  console.log('Uninstall complete.');
  console.log('The service exists: ', svc.exists);
});

// Uninstall the service.
svc.uninstall();
```

This can also be run as any other node script:

```sh
node uninstall-windows.service.js
```