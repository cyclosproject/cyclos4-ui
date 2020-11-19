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
    let landingPage: FrontendLandingPageEnum = FrontendLandingPageEnum.HOME;

    // The only possibility for the landing page not being home is when there's no logged user on mobile
    if (this.dataForFrontendHolder.user == null && this.layout.ltmd) {
      landingPage = this.dataForFrontendHolder.dataForFrontend.mobileLandingPage || FrontendLandingPageEnum.HOME;
    }

    // Redirect to the actual page
    this.router.navigate([landingPage], { replaceUrl: true });
  }
}
