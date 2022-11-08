# Introducing FeathersJS

FeathersJS a flexible, real-time JavaScript framework built on top of Express for the server and as a standalone client for the browser and React Native.

FeathersJS isn’t just another Rails clone. Instead of the typical **MVC** pattern it encourages a Service Oriented Architecture paired with Cross-cutting Concerns allowing you to build complex real-time apps and scalable **REST APIs** very quickly and with very little code. Sounds too good to be true? Once you try it you’ll see that you can build prototypes in minutes and flexible, scalable, production-ready apps in days. Not weeks or months.

### Modern, solid, and 100% JavaScript

Feathers is built using promises and **ES6** so you can build your apps with the latest JavaScript features and write terse, elegant code. Feathers itself is only a few hundred lines of code and is a fully compatible wrapper over top of [Express](http://expressjs.org/), [Socket.io](http://socket.io/) and [Primus](https://github.com/primus/primus), all of which have been used in production by thousands of companies.

### Universal

Feathers can be used in the browser, React Native and server side and provides everything you need to structure your application and communicate with a Feathers server while still letting you pick your favourite view engine. Using the [Feathers client](http://docs.feathersjs.com/clients/feathers.html) you can quickly add authentication, share validation and business logic code between your server and client, and easily make your apps real-time.

### Framework Friendly

Feathers is completely client agnostic and easily integrates with any client side framework. It plays especially well with React, Angular and React Native. They’re practically BFFs. [We have guides](http://docs.feathersjs.com/guides/readme.html) for some of the most popular JS frameworks and are adding new ones every week.

### Service Oriented

[Services](https://docs.feathersjs.com/api/services.html) are the core of Feathers. They provide instant **CRUD** functionality for a resource through a series of familiar methods; find, get, create, update, patch, and remove. Almost any resource can be mapped to these actions; external APIs, database resources, file uploads, you name it. This consistent interface makes it easy to “hook” into these **CRUD** actions to provide custom functionality. For example, if you have a socket transport like Socket.io enabled, Feathers will automatically emit created, updated, patched, and removed events for you.

Feathers gives you the structure to build service oriented apps from day one by keeping services discrete. If you eventually need to split up your app into microservices it’s an easy transition and your Feathers apps can scale painlessly.

### Instant Real-time REST APIs

Since Feathers provides instant CRUD functionality via [Services](https://docs.feathersjs.com/api/services.html), it also exposes both a **RESTful** and **real-time API** automatically through **HTTP/HTTPS** and over websockets. Feathers allows you to send and receive data over sockets similar to Meteor’s DDP so you can use Primus or Socket.io for your sole app communication… or not. Feathers gives you the flexibility to choose how you want to expose your **REST API**; over **HTTP(S)**, **websockets** or **both** — and it does this with just a few lines of code.

### Datastore Agnostic

Feathers has adapters for [15+ data sources](https://docs.feathersjs.com/api/databases/adapters.html) and **4 different ORMs** out of the box. More than any other real-time framework! This gives you the ability to access data in **MongoDB**, **Postgres**, **MySQL**, **Sequel Server**, **S3** and more! You can have multiple datastores in a single app and swap them out painlessly due to our [consistent query interface](https://docs.feathersjs.com/api/databases/querying.html).

### Incredibly Pluggable

We like to consider Feathers as a “batteries included but easily swappable framework”. We have entirely optional plugins that provide [authentication](https://github.com/feathersjs/feathers-authentication), [SMS](https://github.com/feathersjs/feathers-twilio), or [email](https://github.com/feathersjs/feathers-mailer) messaging out of the box. You can include exactly what you need, typically in just a couple lines of code. No more, no less.

