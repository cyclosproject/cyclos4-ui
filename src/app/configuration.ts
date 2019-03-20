import { AdCategoryConfiguration } from 'app/content/ad-category-configuration';
import { BannerCardsResolver } from 'app/content/banner-cards-resolver';
import { ContentGetter } from 'app/content/content-getter';
import { ContentPagesResolver } from 'app/content/content-pages-resolver';
import { ContentWithLayout } from 'app/content/content-with-layout';
import { DashboardResolver } from 'app/content/dashboard-resolver';
import { DefaultDashboardResolver } from 'app/content/default-dashboard-resolver';

/**
 * The global configuration
 */
export class Configuration {
  /*
   * The root URL for the API. Either 'api' (without slashes) when using a proxy,
   * or the full URL (with protocol) to the Cyclos backend, ending with /api.
   */
  static apiRoot = 'api';

  /** Application title */
  static appTitle = 'Cyclos';

  /** Application title displayed on small devices */
  static appTitleSmall = 'Cyclos frontend';

  /** Application title displayed on the sidenav menu small devices */
  static appTitleMenu = 'Cyclos menu';

  /** Available page sizes for search results */
  static searchPageSizes = [40, 100, 200];

  /** Default page size for search results */
  static defaultPageSize = Configuration.searchPageSizes[0];

  /** Page size on quick search / autocomplete */
  static quickSearchPageSize = 10;

  /** Custom configuration for ad categories, by category internal name */
  static adCategories: { [internalName: string]: AdCategoryConfiguration } = {
    'community': { icon: 'people', color: '#2196f3' },
    'food': { icon: 'restaurant', color: '#f04d4e' },
    'goods': { icon: 'pages', color: '#ff9700' },
    'housing': { icon: 'location_city', color: '#029487' },
    'jobs': { icon: 'work', color: '#8062b3' },
    'labor': { icon: 'business', color: '#de3eaa' },
    'leisure': { icon: 'mood', color: '#687ebd' },
    'services': { icon: 'room_service', color: '#8ec63f' }
  };

  /** Whether to use a separated menu bar (true) or merge the menu and top bar (false) */
  static menuBar = true;

  /**
   * Identifier for a static locale. A static locale is compiled into the generated
   * JavaScript code, without needing to perform an additional request to fetch the
   * translations content.
   */
  static staticLocale?: string;

  /**
   * Object containing the translation values of the static translation
   */
  static staticTranslations?: any;

  /**
   * Some systems use an external site to login users, then redirect the client with
   * the session token to Cyclos. When that is the case, this is the URL which contains
   * the external login form.
   */
  static externalLoginUrl?: string;

  /**
   * When using an external login, and supported, will send this parameter containing the
   * internal path to which users should be redirected after logging in.
   */
  static externalLoginParam?: string;

  /**
   * When using an external login, is the URL to where users are redirected after logging-out.
   */
  static afterLogoutUrl?: string;

  /**
   * The content displayed on the home page for guests
   */
  static homePage: ContentWithLayout = {
    content: ContentGetter.url('content/home.html')
  };

  /**
   * The resolver for the dashboard elements
   */
  static dashboard: DashboardResolver = new DefaultDashboardResolver();

  /**
   * The resolver for content pages
   */
  static contentPages?: ContentPagesResolver;

  /**
   * The resolver for banners
   */
  static banners?: BannerCardsResolver;

}

