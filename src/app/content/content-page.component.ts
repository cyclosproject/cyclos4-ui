import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { ContentPage } from 'app/content/content-page';
import { ContentService } from 'app/core/content.service';
import { BaseViewPageComponent } from 'app/shared/base-view-page.component';
import { ActiveMenu, RootMenu, Menu } from 'app/shared/menu';

/**
 * Displays a content page with layout
 */
@Component({
  selector: 'content-page',
  templateUrl: 'content-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContentPageComponent extends BaseViewPageComponent<ContentPage> implements OnInit {

  private slug: string;

  get page(): ContentPage {
    return this.data;
  }

  constructor(
    injector: Injector,
    private content: ContentService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.slug = this.route.snapshot.params.slug;
    const page = this.content.contentPage(this.slug);
    if (page) {
      this.data = page;
      this.layout.fullWidth = page.layout === 'full';
      this.layout.title = page.title || page.label;
    } else {
      this.errorHandler.handleNotFoundError({});
    }
  }

  resolveMenu(page: ContentPage) {
    const rootMenu = page.rootMenu;
    let menu: Menu;
    switch (rootMenu) {
      case RootMenu.BANKING:
        menu = Menu.CONTENT_PAGE_BANKING;
        break;
      case RootMenu.MARKETPLACE:
        menu = Menu.CONTENT_PAGE_MARKETPLACE;
        break;
      case RootMenu.PERSONAL:
        menu = Menu.CONTENT_PAGE_PERSONAL;
        break;
      default:
        menu = Menu.CONTENT_PAGE_CONTENT;
        break;
    }
    return new ActiveMenu(menu, { contentPage: this.slug });
  }

}
