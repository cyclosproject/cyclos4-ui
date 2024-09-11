import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FrontendContentLayoutEnum, FrontendMenuEnum, FrontendPageTypeEnum } from 'app/api/models';
import { FrontendPageWithContent } from 'app/api/models/frontend-page-with-content';
import { FrontendService } from 'app/api/services/frontend.service';
import { ScriptLoaderService } from 'app/core/script-loader.service';
import { getRootSpinnerSvg } from 'app/shared/helper';
import { CardMode } from 'app/ui/content/card-mode';
import { BaseViewPageComponent } from 'app/ui/shared/base-view-page.component';
import { ActiveMenu, Menu } from 'app/ui/shared/menu';

export const IframeResizerUrl = 'https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/4.3.6/iframeResizer.min.js';

/**
 * Displays a content page with layout
 */
@Component({
  selector: 'content-page',
  templateUrl: 'content-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContentPageComponent extends BaseViewPageComponent<FrontendPageWithContent> implements OnInit {
  private static nextId = 0;

  FrontendContentLayoutEnum = FrontendContentLayoutEnum;

  cardMode: CardMode;

  private slug: string;

  get page(): FrontendPageWithContent {
    return this.data;
  }

  constructor(injector: Injector, private frontendService: FrontendService, private scriptLoader: ScriptLoaderService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.slug = this.route.snapshot.params.slug;
    this.addSub(this.frontendService.viewFrontendPage({ key: this.slug }).subscribe(page => this.preProcessPage(page)));
  }

  private preProcessPage(page: FrontendPageWithContent) {
    if ([FrontendPageTypeEnum.CONTENT, FrontendPageTypeEnum.IFRAME].includes(page.type)) {
      // For types that actually show something in the page, adjust the UI layout
      this.uiLayout.fullWidth = page.layout === 'full';
      this.uiLayout.title = page.name;
      this.cardMode = page.layout === FrontendContentLayoutEnum.CARD_TIGHT ? 'tight' : 'normal';
    }
    switch (page.type) {
      case FrontendPageTypeEnum.CONTENT:
        // The content is already present. Just initialize.
        this.data = page;
        break;
      case FrontendPageTypeEnum.IFRAME:
        // For iframe, make sure the script is loaded, then assign the content and initialize
        this.addSub(
          this.scriptLoader.loadScript(IframeResizerUrl).subscribe(() => {
            page.content = this.iframe(page.url);
            this.data = page;
          })
        );
        break;
      case FrontendPageTypeEnum.URL:
        // For URL, open the new tab and navigate back to home
        window.open(page.url, '_blank');
        this.router.navigate([], {
          replaceUrl: true
        });
        break;
      case FrontendPageTypeEnum.OPERATION:
        // For custom operation, navigate to the execution page
        this.breadcrumb.clear();
        this.router.navigate(
          [
            '/operations',
            'menu',
            this.ApiHelper.internalNameOrId(page),
            this.ApiHelper.internalNameOrId(page.operation)
          ],
          {
            replaceUrl: true
          }
        );
        break;
      case FrontendPageTypeEnum.WIZARD:
        // For wizard, navigate to the execution page
        this.breadcrumb.clear();
        this.router.navigate(['/wizards', 'menu', this.slug, this.ApiHelper.internalNameOrId(page.wizard)], {
          replaceUrl: true
        });
        break;
    }
  }

  iframe(url: string) {
    const theme = this.layout.darkTheme ? 'dark' : 'light';
    const actualUrl = url + (url.includes('?') ? '&' : '?') + `theme=${theme}`;
    const idIx = ContentPageComponent.nextId++;
    const wrapperId = `wrapper_${idIx}`;
    const iframeId = `iframe_${idIx}`;
    const spinnerId = `spinner_${idIx}`;
    const spinner = getRootSpinnerSvg();
    return `
        <div id="${wrapperId}" class="iframe-content-wrapper">
          <div id="${spinnerId}" class="iframe-loading-spinner">
            ${spinner}
          </div>
          <iframe id="${iframeId}"
            src="${actualUrl}"
            class="iframe-content"
            style="display:block;width:1px;min-width:100%;position:absolute;left:-10000px;top:0px;"
            onload="
              iFrameResize({
                heightCalculationMethod: navigator.userAgent.indexOf('MSIE') < 0 ? 'lowestElement' : 'max',
                checkOrigin: false,
                warningTimeout: 0
              }, '#${iframeId}');
              document.getElementById('${wrapperId}').removeChild(document.getElementById('${spinnerId}'));
              this.style.position = 'relative';
              this.style.top = '';
              this.style.left = '';
            ">
          </iframe>
        </div>
    `;
  }

  resolveMenu(page: FrontendPageWithContent) {
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
