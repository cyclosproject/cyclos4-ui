import { Banner } from 'app/content/banner';
import { BannerResolver } from 'app/content/banner-resolver';
import { ContentGetter } from 'app/content/content-getter';
import { Menu } from 'app/shared/menu';

function contentPage(id: string): Banner[] {
  return [{
    content: ContentGetter.cyclosPage(`https://test.cyclos.org/testui/web-rpc/menuEntry/menuItemDetails/${id}`)
  }];
}

function img(url: string): Banner[] {
  return [{
    content: `<img class="w-100" src="${url}">`
  }];
}


/**
 * Resolves the banners used on test-ui
 */
export class TestUiBannerResolver implements BannerResolver {
  resolveCards() {
    return [
      {
        menus: [Menu.PUBLIC_MARKETPLACE],
        guests: true,
        banners: contentPage('8730529974872367441')
      },
      {
        menus: [Menu.PUBLIC_MARKETPLACE],
        guests: true,
        banners: contentPage('8730530095131451729')
      },
      {
        menus: [Menu.REGISTRATION],
        guests: true,
        banners: contentPage('8730530077951582545')
      },
      {
        menus: [Menu.SEARCH_ADS],
        ngClass: 'p-0',
        banners: img('https://www.cyclos.org/wp-content/uploads/2018/12/Banner_Marketplace.png')
      }
    ];
  }
}
