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
    name: 'START_APP',
    value: 'win_service' // env START_APP = 'win_service'|'win_user'; Start application as windows service
  },
  
  ]
});

// Listen for the "install" event, which indicates the process is available as a service.
svc.on('install', function () {
  svc.start();
  console.log('Install complete.');
});

// Error - Fired in some instances when an error occurs.
svc.on('error', function (err) {
  console.log('feathers-opcua-server.Error:', err);
});

svc.install();