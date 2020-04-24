import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { LayoutService } from 'app/shared/layout.service';

/**
 * Redirect either to login or home, according to the configuration and logged user
 */
@Component({
  selector: 'redirect-to-landing',
  template: ' ',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RedirectToLandingPageComponent implements OnInit {

  constructor(
    private dataForUiHolder: DataForUiHolder,
    private layout: LayoutService,
    private router: Router) {
  }

  ngOnInit() {
    let landingPage: 'home' | 'login' = 'home';

    // When there's a logged user the landing page is always home
    if (this.dataForUiHolder.user == null) {
      landingPage = this.layout.getBreakpointConfiguration('landingPage') || landingPage;
    }

    // Redirect to the actual page
    this.router.navigate([landingPage], { replaceUrl: true });
  }
}
