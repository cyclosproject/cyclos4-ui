// This file defines the environment variables shared by both development and production

// The root URL for the API. Either 'api' (without slashes) when using a proxy, or the full URL
// (with protocol) to the Cyclos backend, ending with /api.
const API_URL = 'http://localhost:8888/api';

// Application title
const APP_TITLE = 'Cyclos Local';
// Application title on small devices (constrained space)
const APP_TITLE_SMALL = 'Cyclos';
// The application title displayed on the title bar inside the menu on small devices
const APP_TITLE_MENU = 'Cyclos menu';

// Available choices for number of results in a search. The default is the smallest one
const SEARCH_PAGE_SIZES = [40, 100, 200];
// Number of results displayed on quick searches, such as on user selection
const QUICK_SEARCH_PAGE_SIZE = 10;

// This defines a mapping between advertisement category internal name and material icons.
// See https://material.io/tools/icons
const AD_CATEGORY_ICONS = {
  'community': 'people',
  'food': 'restaurant',
  'goods': 'pages',
  'housing': 'location_city',
  'jobs': 'work',
  'labor': 'business',
  'leisure': 'mood',
  'services': 'room_service'
};
// This defines a mapping between advertisement category internal name and icon colors
const AD_CATEGORY_COLORS = {
  'community': '#2196f3',
  'food': '#f04d4e',
  'goods': '#ff9700',
  'housing': '#029487',
  'jobs': '#8062b3',
  'labor': '#de3eaa',
  'leisure': '#687ebd',
  'services': '#8ec63f'
};

export const configuration = {
  appTitle: APP_TITLE,
  appTitleSmall: APP_TITLE_SMALL,
  appTitleMenu: APP_TITLE_MENU,
  apiRoot: API_URL,
  searchPageSizes: SEARCH_PAGE_SIZES,
  quickSearchPageSize: QUICK_SEARCH_PAGE_SIZE,
  adCategoryIcons: AD_CATEGORY_ICONS,
  adCategoryColors: AD_CATEGORY_COLORS
};
