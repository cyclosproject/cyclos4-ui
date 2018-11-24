import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
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

  content = new BehaviorSubject('');
  title: string;

  constructor(
    private injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const guest = this.login.user == null;
    const key = guest ? 'guestsHome' : 'usersHome';

    this.title = guest ? this.i18n('Welcome to {{name}}', {
      name: this.format.appTitle
    }) : this.i18n('Home');

    // The content is cached
    this.addSub(this.cache.get(key, () => {
      const getter = guest ? environment.guestsHome : environment.usersHome;
      return getter.get({
        user: this.login.user,
        injector: this.injector
      });
    }).subscribe(content => this.content.next(content)));
  }
}
