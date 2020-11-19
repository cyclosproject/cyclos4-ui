import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FrontendContentLayoutEnum, FrontendMenuEnum, FrontendPage, FrontendPageTypeEnum } from 'app/api/models';
import { FrontendService } from 'app/api/services/frontend.service';
import { ScriptLoaderService } from 'app/core/script-loader.service';
import { CardMode } from 'app/ui/content/card-mode';
import { BaseViewPageComponent } from 'app/ui/shared/base-view-page.component';
import { ActiveMenu, Menu } from 'app/ui/shared/menu';

export type PageWithContent = FrontendPage & { content: string };

export const IframeResizerUrl = 'https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/4.2.11/iframeResizer.min.js';

/**
 * Displays a content page with layout
 */
@Component({
  selector: 'content-page',
  templateUrl: 'content-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentPageComponent extends BaseViewPageComponent<PageWithContent> implements OnInit {

  private static nextId = 0;

  FrontendContentLayoutEnum = FrontendContentLayoutEnum;

  cardMode: CardMode;

  private slug: string;

  get page(): PageWithContent {
    return this.data;
  }

  constructor(
    injector: Injector,
    private frontendService: FrontendService,
    private scriptLoader: ScriptLoaderService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.slug = this.route.snapshot.params.slug;
    const page = this.dataForFrontendHolder.page(this.slug) as PageWithContent;
    this.cardMode = page.layout === FrontendContentLayoutEnum.CARD_TIGHT ? 'tight' : 'normal';
    if (page) {
      switch (page.type) {
        case FrontendPageTypeEnum.CONTENT:
          // For others, fetch the content
          this.addSub(this.frontendService.frontendPageContent({ key: this.slug })
            .subscribe(content => {
              page.content = content;
              this.data = page;
            }));
          break;
        case FrontendPageTypeEnum.IFRAME:
          // For iframe, make sure the script is loaded, then assign the content
          this.addSub(this.scriptLoader.loadScript(IframeResizerUrl).subscribe(() => {
            page.content = this.iframe(page.url);
            this.data = page;
          }));
          break;
        case FrontendPageTypeEnum.URL:
          window.open(page.url, '_blank');
          break;
        case FrontendPageTypeEnum.OPERATION:
          this.breadcrumb.clear();
          this.router.navigate(['operations', 'menu',
            this.ApiHelper.internalNameOrId(page),
            this.ApiHelper.internalNameOrId(page.operation)], {
            replaceUrl: true
          });
          break;
        case FrontendPageTypeEnum.WIZARD:
          this.breadcrumb.clear();
          this.router.navigate(['wizards', 'menu', this.slug, this.ApiHelper.internalNameOrId(page.wizard)], {
            replaceUrl: true
          });
          break;
      }
      if (page.type === FrontendPageTypeEnum.IFRAME) {
      } else {
      }
    } else {
      this.errorHandler.handleNotFoundError({});
    }
  }

  onDataInitialized(page: PageWithContent) {
    this.uiLayout.fullWidth = page.layout === 'full';
    this.uiLayout.title = page.name;
  }

  iframe(url: string) {
    const theme = this.layout.darkTheme ? 'dark' : 'light';
    const actualUrl = url + (url.includes('?') ? '&' : '?') + `theme=${theme}`;
    const idIx = ContentPageComponent.nextId++;
    const wrapperId = `wrapper_${idIx}`;
    const iframeId = `iframe_${idIx}`;
    const spinnerId = `spinner_${idIx}`;
    return `
        <div id="${wrapperId}" class="iframe-content-wrapper">
          <div id="${spinnerId}" class="iframe-loading-spinner">
          <div class="spinner">
          <img src="images/spinner.svg">
        </div>
          </div>
          <iframe id="${iframeId}"
            src="${actualUrl}"
            class="iframe-content"
            style="display:block;width:1px;min-width:100%;"
            onload="
              iFrameResize({
                heightCalculationMethod: navigator.userAgent.indexOf('MSIE') < 0 ? 'lowestElement' : 'max',
                checkOrigin: false,
                warningTimeout: 0
              }, '#${iframeId}');
              document.getElementById('${wrapperId}').removeChild(document.getElementById('${spinnerId}'));
            ">
          </iframe>
        </div>
    `;
  }

  resolveMenu(page: PageWithContent) {
    let menu: Menu;
    switch (page.menu) {
      case FrontendMenuEnum.BANKING:
        menu = Menu.CONTENT_PAGE_BANKING;
        break;
      case FrontendMenuEnum.USERS:
      case FrontendMenuEnum.MARKETPLACE:
        menu = Menu.CONTENT_PAGE_MARKETPLACE;
        break;
      case FrontendMenuEnum.PERSONAL:
        menu = Menu.CONTENT_PAGE_PERSONAL;
        break;
      default:
        menu = Menu.CONTENT_PAGE_CONTENT;
        break;
    }
    return new ActiveMenu(menu, { menuItem: page, contentPage: this.slug });
  }

}
