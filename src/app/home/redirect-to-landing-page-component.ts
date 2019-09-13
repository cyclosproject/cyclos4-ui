import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Configuration } from 'app/configuration';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { LayoutService } from 'app/shared/layout.service';

/**
 * Redirect either to login or home, according to the configuration and logged user
 */
@Component({
  selector: 'redirect-to-landing',
  template: ' ',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RedirectToLandingPageComponent implements OnInit {

  constructor(
    private dataForUiHolder: DataForUiHolder,
    private layout: LayoutService,
    private router: Router) {
  }

  ngOnInit() {
    const breakpoints = this.layout.activeBreakpoints;
    const configs = Configuration.breakpoints;

    let landingPage: 'home' | 'login' = 'home';

    // When there's a logged user the landing page is always home
    if (this.dataForUiHolder.user == null) {
      for (const bp of breakpoints) {
        const config = configs[bp];
        if (config && config.landingPage) {
          landingPage = config.landingPage;
          break;
        }
      }
    }

    // Redirect to the actual page
    this.router.navigate([landingPage], { replaceUrl: true });
  }
}
