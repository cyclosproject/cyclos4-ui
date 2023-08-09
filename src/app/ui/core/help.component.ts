import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  FrontendContentLayoutEnum,
  FrontendHomeContent
} from 'app/api/models';
import { FrontendService } from 'app/api/services/frontend.service';
import { CardMode } from 'app/ui/content/card-mode';
import { BasePageComponent, UpdateTitleFrom } from 'app/ui/shared/base-page.component';

/**
 * Displays the help page
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'help',
  templateUrl: 'help.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpComponent extends BasePageComponent<FrontendHomeContent> implements OnInit {

  FrontendContentLayoutEnum = FrontendContentLayoutEnum;
  cardMode: CardMode;

  constructor(
    injector: Injector,
    private frontendService: FrontendService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    if (!this.dataForFrontendHolder.dataForFrontend?.hasHelp) {
      // No help page!
      this.router.navigate([this.dataForFrontendHolder.user ? '/dashboard' : '/home']);
      return;
    }

    // Emulate keyboard scroll for KaiOS
    this.emulateKeyboardScroll();

    // Fetch the help page
    this.addSub(this.frontendService.getFrontendHelp().subscribe(data => this.data = data));
  }

  protected onDataInitialized(data: FrontendHomeContent): void {
    this.cardMode = data.layout === FrontendContentLayoutEnum.CARD_TIGHT ? 'tight' : 'normal';
  }

  updateTitleFrom(): UpdateTitleFrom {
    return 'menu';
  }

  resolveMenu() {
    return this.menu.helpMenu;
  }
}
