const { cwd } = require('process');
const appRoot = cwd();
const { join } = require('path');
const filePath = join(appRoot, 'src\\index.js');
var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
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