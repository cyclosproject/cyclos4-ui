import { Configuration } from 'app/configuration';

/**
 * Set all desired Cyclos configuration options
 */
export function setup() {
  Configuration.apiRoot = 'api';
  Configuration.appTitle = 'Cyclos';
  Configuration.appTitleSmall = 'Cyclos frontend';
  Configuration.appTitleMenu = 'Cyclos menu';
  Configuration.menuBar = false;
  Configuration.contentPages = {
    contentPages: () => [
      {
        title: 'AAA',
        content: 'AAAAAAAAAAAAAAAAAAAAAAAA'
      },
      {
        title: 'BBB',
        content: 'BBBBBBBBBBBBBBBBBBBBBBBB'
      },
      {
        title: 'CCC',
        content: 'CCCCCCCCCCCCCCCCCCCCCCCC'
      },
      {
        title: 'DDD',
        content: 'DDDDDDDDDDDDDDDDDDDDDDDD'
      }
    ]
  };
}

