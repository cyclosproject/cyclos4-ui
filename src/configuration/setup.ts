import { Configuration } from 'configuration/configuration';

/**
 * Used to initialize all the configurations
 * @param config The configuration instance, pre-filled with defaults
 */
export function setup(config: Configuration) {
  // Set all configurations here
  config.apiUrl = 'http://localhost:8888/api';
  config.appTitle = 'Cyclos frontend';
  config.appTitleSmall = 'Cyclos';
  config.appTitleMenu = 'Cyclos menu';
  config.menuBar = true;
}

