import { Configuration } from 'app/ui/configuration';

/**
 * Set all desired Cyclos configuration options
 */
export function setup() {
  Configuration.apiRoot = 'api';
  Configuration.appTitle = 'Cyclos';
  Configuration.appTitleSmall = 'Cyclos';
  Configuration.appTitleMenu = 'Cyclos menu';
}
