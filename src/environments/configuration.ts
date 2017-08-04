// This file defines the environment variables shared by both development and production
import { DataForUi } from "app/api/models";

// The root URL for the API. Don't forget to include the /api in the end
const API_URL = 'http://localhost:8888/england/api';

// Application title
const APP_TITLE = 'Cyclos Local';
// The application title displayed on the title bar inside the menu on small devices
const APP_TITLE_MENU = 'Cyclos';

// UI Data
var DATA_FOR_UI: DataForUi = null;
// It is possible to avoid a request to the server to fetch localization data.
// To do so, uncomment the code below and set the correct data.
/*
DATA_FOR_UI = {
  language: {code: 'en'},
  country: 'br',
  dateFormat: 'dd/MM/yyyy',
  timeFormat: 'HH:mm',
  decimalSeparator: ',',
  groupingSeparator: '.',
  resourceCacheKey: `${Math.random()}_${new Date().getTime()}`
};
*/

// Translations
// It is possible to set the application to be statically translated by commenting the
// var declarations, uncommenting the import statements and adjusting the json files
// to include the correct language, such as "../translations/general_es.json".
// This will embed the translations in the generated web application resources and
// will prevent additional requests from being performed on runtime, but will force
// a single language for the application.

var GENERAL_TRANSLATIONS = null;
var ACCOUNT_TRANSLATIONS = null;
// import * as GENERAL_TRANSLATIONS from "../translations/general.json";
// import * as ACCOUNT_TRANSLATIONS from "../translations/account.json";

export const configuration = {
  appTitle: APP_TITLE,
  appTitleMenu: APP_TITLE_MENU,
  apiRoot: API_URL,
  dataForUi: DATA_FOR_UI,
  translations: {
    general: GENERAL_TRANSLATIONS,
    account: ACCOUNT_TRANSLATIONS
  }
};
