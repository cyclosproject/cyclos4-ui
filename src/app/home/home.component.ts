import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { ContentService } from 'app/core/content.service';
import { BasePageComponent } from 'app/shared/base-page.component';
import { environment } from 'environments/environment';
import { BehaviorSubject } from 'rxjs';

/**
 * Displays the home page
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'home',
  templateUrl: 'home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent extends BasePageComponent<void> implements OnInit {

  content$ = new BehaviorSubject<string>(null);
  title: string;

  constructor(
    injector: Injector,
    private contentService: ContentService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const guest = this.login.user == null;

    this.title = guest ? this.i18n('Welcome to {{name}}', {
      name: this.format.appTitle
    }) : this.i18n('Quick access');

    const home = guest ? environment.guestsHome : environment.usersHome;
    this.addSub(this.contentService.get(home).subscribe(content => this.content$.next(content)));
  }
}
