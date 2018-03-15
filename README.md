# Cyclos 4 user interface

<img src="cyclos.png" align="right" width="120" alt="Cyclos"/>
This project aims to create a modern, simple and intuitive user interface for [Cyclos](https://www.cyclos.org). The interface should be easy to customize and add functionality needed by specific projects.

The initial planned scope is to have end-user functionality in this application. Administration functionality will still be available in Cyclos' default web interface.

This user interface is still in very early days of development, and not yet useful for production. Cyclos 4.10 or newer is required for the back-end.

## Technical details

- This application is built using [Angular Material](https://material.angular.io/);
- It uses Cyclos' REST API for integration. The [ng-swagger-gen](https://github.com/cyclosproject/ng-swagger-gen) project is used to generate the client services and web service models;
- The application doesn't uses Angular's i18n support for internationalization, as it only supports translations in Angular templates, not in components. Also, the built-in Angular i18n requires a different compilation per language. Instead, translations are done using the [ng-translation-gen](https://github.com/cyclosproject/ng-translation-gen) project;
- The translations are done separatedly from the Cyclos installation. This way they cannot be customized in Cyclos, but allows the user interface to grow independently from the deployed Cyclos version;
- Requests to the Cyclos server are performed directly from the browser. That means that either this front-end should be deployed in the same domain as Cyclos, or CORS should be enabled in Cyclos by setting `cyclos.cors.origin = cyclos4-ui-domain` in the `cyclos.properties` file.

## Requirements

- [NodeJS](https://nodejs.org/) version 8+;
- [NPM](https://www.npmjs.com/) version 5+.

These are the versions used on the development of the Cyclos 4 user interface, but older versions might work as well.

## Getting and preparing the code

First, make sure you have cloned the repository, the current working directory is `cyclos4-ui` and the NPM dependencies are installed (might take a while the first time to download all dependencies):
```bash
git clone https://github.com/cyclosproject/cyclos4-ui.git
cd cyclos4-ui
npm install
```

## Setting the Cyclos server URL
On the `src/environments/configuration.ts` you will find the file that needs to be configured for your project.
The most important settings are the following:
```typescript
// The root URL for the API. Don't forget to include the /api in the end
const API_URL = 'http://localhost:8888/england/api';
// Application title
const APP_TITLE = 'Cyclos Local';
// The application title displayed on the title bar inside the menu on small devices
const APP_TITLE_MENU = 'Cyclos';
```

## Building
Once you have the configuration set, you can build the user interface by typing:
```bash
npm run build
```

After the build process (which can take a few minutes) you will have the `dist` directory containing the resources that should be deployed to your web server (Apache, Nginx, etc).

Angular assumes the application is deployed in the root path of your domain. For example, this is the case for `https://ui.my-project.com`. If this is not the case, such as `https://www.my-project.com/ui` you need to pass in the path name to Angular at compilation time, like:
```bash
# Replace /ui/ with your path. Don't forget both leading and trailing slashes.
npm run build -- -bh /ui/
```

## Status
The 