import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { FormatService } from 'app/core/format.service';
import { LoginService } from 'app/core/login.service';
import { MenuService } from 'app/core/menu.service';
import { LayoutService } from 'app/shared/layout.service';
import { BehaviorSubject } from 'rxjs';
import { PushNotificationsService } from 'app/core/push-notifications.service';

declare const setSpinnerVisible: (boolean) => void;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  constructor(
    private title: Title,
    private router: Router,
    private format: FormatService,
    private dataForUiHolder: DataForUiHolder,
    public login: LoginService,
    public menu: MenuService,
    public layout: LayoutService,
    // PushNotificationsService is here because it is not directly used by any
    // other component / service, but handles itself the push notifications.
    // It would otherwise be removed from the built app by tree-shaking.
    private push: PushNotificationsService
  ) { }

  initialized = new BehaviorSubject(false);
  loggingOut = new BehaviorSubject(false);

  ngOnInit() {
    this.push.initialize();
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.title.setTitle(this.format.appTitle);
    this.dataForUiHolder.subscribe(dataForUi => {
      if (dataForUi != null) {
        this.initialized.next(true);
      }
    });
    if (this.dataForUiHolder.dataForUi) {
      // Already initialized?!?
      this.initialized.next(true);
    }
    this.login.subscribeForLoggingOut(flag => this.loggingOut.next(flag));
    setSpinnerVisible(false);
  }
}
