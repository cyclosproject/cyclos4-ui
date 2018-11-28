import { BannerResolver } from 'app/content/banners-resolver';
import { Content, DEFAULT_CACHE_SECONDS } from 'app/content/content';
import { ContentGetter } from 'app/content/content-getter';

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

// **** Advertisements category customization **** //

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

// **** Content **** //
// See the project home page for help on how to customize content

// Content for guests' home page
const GUESTS_HOME: Content = {
  cacheKey: 'guestsHome',
  cacheSeconds: DEFAULT_CACHE_SECONDS,
  content: ContentGetter.url('content/users-home.html')
};
// Content for logged users's home page
const USERS_HOME: Content = {
  cacheKey: 'usersHome',
  cacheSeconds: DEFAULT_CACHE_SECONDS,
  content: ContentGetter.url('content/users-home.html')
};
// Banner resolver
const BANNER_RESOLVER: BannerResolver = null;


//////////////////////////////////////////////////////////////////////
// **** Final configuration. Please, don't modify it **** //
export const configuration = {
  production: true,
  appTitle: APP_TITLE,
  appTitleSmall: APP_TITLE_SMALL,
  appTitleMenu: APP_TITLE_MENU,
  apiRoot: API_URL,
  searchPageSizes: SEARCH_PAGE_SIZES,
  quickSearchPageSize: QUICK_SEARCH_PAGE_SIZE,
  adCategoryIcons: AD_CATEGORY_ICONS,
  adCategoryColors: AD_CATEGORY_COLORS,
  guestsHome: GUESTS_HOME,
  usersHome: USERS_HOME,
  bannerResolver: BANNER_RESOLVER
};
