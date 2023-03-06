import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiHelper } from 'app/shared/api-helper';

/**
 * Redirect either to login or home, according to the configuration and logged user
 */
@Component({
  selector: 'redirect-to-location',
  template: ' ',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RedirectToLocationComponent implements OnInit {

  constructor(
    private router: Router,
    private route: ActivatedRoute) {
  }

  ngOnInit() {
    const location = this.route.snapshot.params.location;
    const id = this.route.snapshot.queryParams.id;
    const externalPaymentToken = this.route.snapshot.queryParams.externalPaymentToken;
    const url = ApiHelper.urlForLocation(location, id ?? externalPaymentToken);
    this.router.navigateByUrl(url, { replaceUrl: true, skipLocationChange: true });
  }
}
