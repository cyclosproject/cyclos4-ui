import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FrontendLandingPageEnum } from 'app/api/models/frontend-landing-page-enum';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { LayoutService } from 'app/core/layout.service';

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
    private dataForFrontendHolder: DataForFrontendHolder,
    private layout: LayoutService,
    private router: Router) {
  }

  ngOnInit() {
    let landingPage = '/home';

    const data = this.dataForFrontendHolder.dataForFrontend;
    if (this.dataForFrontendHolder.user) {
      landingPage = '/dashboard';
    } else {
      if (data.hasHomePage && this.layout.ltmd) {
        landingPage = data.mobileLandingPage == FrontendLandingPageEnum.LOGIN
          ? '/login' : '/home';
      }
    }

    // Redirect to the actual page
    this.router.navigate([landingPage], { replaceUrl: true });
  }
}
