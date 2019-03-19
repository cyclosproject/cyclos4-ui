import { AdCategoryConfiguration } from 'app/content/ad-category-configuration';

/**
 * Contains all the configuration settings
 */
export interface Configuration {

  /*
   * The root URL for the API. Either 'api' (without slashes) when using a proxy,
   * or the full URL (with protocol) to the Cyclos backend, ending with /api.
   */
  apiUrl?: string;

  /** Application title */
  appTitle?: string;

  /** Application title displayed on small devices */
  appTitleSmall?: string;

  /** Application title displayed on the sidenav menu small devices */
  appTitleMenu?: string;

  /** Available page sizes for search results */
  searchPageSizes?: number[];

  /** Default page size for search results */
  defaultPageSize?: number;

  /** Page size on quick search / autocomplete */
  quickSearchPageSize?: number;

  /** Custom configuration for ad categories, by category internal name */
  adCategories?: { [internalName: string]: AdCategoryConfiguration };

  /** Whether to use a separated menu bar (true) or merge the menu and top bar (false) */
  menuBar?: boolean;

  /**
   * Identifier for a static locale. A static locale is compiled into the generated
   * JavaScript code, without needing to perform an additional request to fetch the
   * translations content.
   */
  staticLocale?: string;

  /**
   * Object containing the translation values of the static translation
   */
  staticTranslations?: any;

  /**
   * Some systems use an external site to login users, then redirect the client with
   * the session token to Cyclos. When that is the case, this is the URL which contains
   * the external login form.
   */
  externalLoginUrl?: string;

  /**
   * When using an external login, and supported, will send this parameter containing the
   * internal path to which users should be redirected after logging in.
   */
  externalLoginParam?: string;

  /**
   * When using an external login, is the URL to where users are redirected after logging-out.
   */
  afterLogoutUrl?: string;

}
