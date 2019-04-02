import { Configuration } from 'app/configuration';

/**
 * Set all desired Cyclos configuration options
 */
export function setup() {
  Configuration.apiRoot = 'api';
  Configuration.appTitle = 'Cyclos';
  Configuration.appTitleSmall = 'Cyclos frontend';
  Configuration.appTitleMenu = 'Cyclos menu';
}

