# Installation

Make sure you have installed 

* [NodeJS](https://nodejs.org/en/download/releases/) v12.*
* [MongoDB x64](https://www.mongodb.com/try/download/community) v6.* (if used) 
* [MongoDB x32](https://www.mongodb.com/try/download/community) v3.2.22 (if used) 
* [Yarn](https://classic.yarnpkg.com/en/docs/install#windows-stable) v1.*

Clone or download the project from [GitHub](https://github.com/bsa-git/feathers-opcua-server).

Install your dependencies:

```bash
    cd to/<feathers-opcua-server>
    yarn install
```
If you are using a database **MongoDB**, then you need to start it before testing or working, using the command:

```bash
    npm run start-mongod
```
or

```bash
    npm run start-mongod32
```

### Environment variables

The `.env` file must be located at the root of the project, if it is missing, then it must be created based on the example file `.env.example`, otherwise the application will throw an **error**. The `.env` file sets environment variables. 

Environment variables usually contain user secrets, such as **user_id**, **user_secret**, etc.

e.g.
```bash
    ...
    # MONGODB
    MONGODB_DEV_URL="mongodb://localhost:27017/feathers_opcua_devserver"
    MONGODB_TEST_URL="mongodb://localhost:27017/feathers_opcua_testserver"
    MONGODB_PROD_URL="mongodb://localhost:27017/feathers_opcua_prodserver"

    # NEDB
    NEDB_DEV_PATH="nedb://../data/nedb/dev"
    NEDB_TEST_PATH="nedb://../data/nedb/test"
    NEDB_PROD_PATH="nedb://../data/nedb/prod"
```

### Testing

Before working with the project, you need to start testing using the command.
```bash
    npm run test:all
```
All tests in the `/test` directory will be executed. If you need to run a separate test, you need to move it to the `/test/debug` directory and run the command.
```bash
    npm run test:debug
```
The test in the `/test/debug` directory will be executed.

This sets the environment variable `NODE_ENV` to **test** mode.
```bash
    cross-env NODE_ENV=test
```
In this case, all test data is written to the test database.
e.g. `mongodb://localhost:27017/feathers_opcua_testserver` or `nedb://../data/nedb/test`

### Script testing

When testing scripts, the command is used:
```bash
    npm run test:script
```
The script test number must be set in the command execution arguments in the `package.json` file, see here: 
```bash
    "scripts": {
        ...
        "mocha:script": "... --timeout 60000 --script=#4.2",
    }
```
This will run the script in test mode `/scripts/test/#4-scriptRunSessionCommand.js`.

### Writing Test Data to the Database

To write the test data from the `/seeds/fake-data.json` file to the test database, you need to run the command:
```bash
    npm run start:seed
```
In this case, the test data will be written to the test database
e.g. `mongodb://localhost:27017/feathers_opcua_testserver` or `nedb://../data/nedb/test`

### Launch of the CLI Scripts

The links to the **cli scripts** are in the `package.json` file, see here:
```bash
    ...
    "bin": {
    "callOpcuaMethod": "./scripts/cli/callOpcuaMethod.js",
    "runOpcuaCommand": "./scripts/cli/runOpcuaCommand.js",
    "createAcmYearTemplate": "./scripts/cli/createAcmYearTemplate.js",
    "getAcmDayReportsData": "./scripts/cli/getAcmDayReportsData.js"
  },
  ...
```
To create links to **cli scripts**, you need to run the command:
```bash
    npm run clone:cli-scripts
```

### Launch of the project

#### In development mode

Run the application in development mode with the command:
```bash
    npm run dev
```
his sets the environment variable `NODE_ENV` to **development** mode.
```bash
    cross-env NODE_ENV=development
```
In this case, all development data is written to the development database.
e.g. `mongodb://localhost:27017/feathers_opcua_devserver` or `nedb://../data/nedb/dev`

#### In production mode

Run the application in production mode with the command:
```bash
    npm start
```
his sets the environment variable `NODE_ENV` to **production** mode.
```bash
    cross-env NODE_ENV=production
```
In this case, all production data is written to the production database.
e.g. `mongodb://localhost:27017/feathers_opcua_prodserver` or `nedb://../data/nedb/prod`