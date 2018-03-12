import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { HttpClient } from '@angular/common/http';

/**
 * Displays the home page
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'home',
  templateUrl: 'home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent extends BaseComponent {

  loaded = new BehaviorSubject(false);

  title: string;
  homeContent: string;

  constructor(
    injector: Injector,
    private httpClient: HttpClient) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const guest = this.login.user == null;
    this.title = guest ?
      this.generalMessages.homeGuestsTitle(this.format.appTitle) :
      this.generalMessages.homeUsersTitle();

    if (guest) {
      // Load the home page content
      this.httpClient.get('content/home.html', {
        responseType: 'text'
      })
        .subscribe(content => {
          this.homeContent = content;
          this.loaded.next(true);
        });
    } else {
      // TODO: Load the data for dashboard
      this.loaded.next(true);
    }
  }
}
