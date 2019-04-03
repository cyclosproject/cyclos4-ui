import { AdCategoryConfiguration } from 'app/content/ad-category-configuration';
import { BannerCardsResolver } from 'app/content/banner-cards-resolver';
import { ContentPagesResolver } from 'app/content/content-pages-resolver';
import { ContentWithLayout } from 'app/content/content-with-layout';
import { DashboardResolver } from 'app/content/dashboard-resolver';
import { OperationConfiguration } from 'app/content/operation-configuration';

/**
 * The global configuration
 */
export interface ConfigurationDefinitions {
  /*
   * The root URL for the API. Either 'api' (without slashes) when using a proxy,
   * or the full URL (with protocol) to the Cyclos backend, ending with /api.
   */
  apiRoot: string;

  /** Application title */
  appTitle: string;

  /** Application title displayed on small devices */
  appTitleSmall: string;

  /** Application title displayed on the sidenav menu small devices */
  appTitleMenu: string;

  /** Whether to use a separated menu bar (true) or merge the menu and top bar (false) */
  menuBar: boolean;

  /** Available page sizes for search results */
  searchPageSizes: number[];

  /** Default page size for search results */
  defaultPageSize: number;

  /** Page size on quick search / autocomplete */
  quickSearchPageSize: number;

  /** Custom configuration for ad categories, by category internal name */
  adCategories: { [internalName: string]: AdCategoryConfiguration };

  /** Custom configuration for custom operations, by operation internal name */
  operations: { [internalName: string]: OperationConfiguration };

  /**
   * Identifier for a static locale. A static locale is compiled into the generated
   * JavaScript code, without needing to perform an additional request to fetch the
   * translations content.
   */
  staticLocale: string;

  /**
   * Object containing the translation values of the static translation
   */
  staticTranslations: any;

  /**
   * Some systems use an external site to login users, then redirect the client with
   * the session token to Cyclos. When that is the case, this is the URL which contains
   * the external login form.
   */
  externalLoginUrl: string;

  /**
   * When using an external login, and supported, will send this parameter containing the
   * internal path to which users should be redirected after logging in.
   */
  externalLoginParam: string;

  /**
   * When using an external login, is the URL to where users are redirected after logging-out.
   */
  afterLogoutUrl: string;

  /**
   * For systems that use this frontend strictly to logged users, and not for guests, via an
   * external login page, this setting can be defined. In this case, whenever clients
   * attempts to access the frontend without being logged in, they will be redirected.
   */
  redirectGuests: string;

  /**
   * The content displayed on the home page for guests
   */
  homePage: ContentWithLayout;

  /**
   * The resolver for the dashboard elements
   */
  dashboard: DashboardResolver;

  /**
   * The resolver for content pages
   */
  contentPages: ContentPagesResolver;

  /**
   * The resolver for banners
   */
  banners: BannerCardsResolver;

}

/** The global configuration */
export const Configuration = {} as ConfigurationDefinitions;
