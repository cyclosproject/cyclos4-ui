import { Configuration } from 'app/configuration';
import { TestUiContentPagesResolver } from 'app/test-ui-content-pages-resolver';
import { TestUiBannerCardsResolver } from 'app/test-ui-banner-cards-resolver';

/**
 * Set all desired Cyclos configuration options
 */
export function setup() {
  Configuration.apiRoot = 'api';
  Configuration.appTitle = 'Cyclos';
  Configuration.appTitleSmall = 'Cyclos frontend';
  Configuration.appTitleMenu = 'Cyclos menu';
  Configuration.contentPages = new TestUiContentPagesResolver;
  Configuration.banners = new TestUiBannerCardsResolver;
}

