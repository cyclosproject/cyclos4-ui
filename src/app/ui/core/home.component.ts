import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { DataForFrontendHome, FrontendContentLayoutEnum } from 'app/api/models';
import { FrontendService } from 'app/api/services/frontend.service';
import { BasePageComponent, UpdateTitleFrom } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';

/**
 * Displays the guest home page
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'home',
  templateUrl: 'home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent extends BasePageComponent<DataForFrontendHome> implements OnInit {
  FrontendContentLayoutEnum = FrontendContentLayoutEnum;

  constructor(injector: Injector, private frontendService: FrontendService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    if (this.dataForFrontendHolder.user) {
      // There's a logged user. Redirect to the dashboard
      this.router.navigate(['/dashboard'], { replaceUrl: true });
      return;
    }

    if (!this.dataForFrontendHolder.dataForFrontend?.hasHomePage) {
      // No home page! Redirect to login
      this.router.navigate(['/login']);
      return;
    }

    // Emulate keyboard scroll for KaiOS
    this.emulateKeyboardScroll();

    // Fetch the home page
    this.addSub(
      this.frontendService
        .dataForFrontendHome({
          screenSize: this.layout.screenSize
        })
        .subscribe(data => (this.data = data))
    );
  }

  defaultFullWidthLayout(): boolean {
    return true;
  }

  updateTitleFrom(): UpdateTitleFrom {
    return 'menu';
  }

  resolveMenu() {
    return Menu.HOME;
  }
}
