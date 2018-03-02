import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BaseComponent } from 'app/shared/base.component';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent extends BaseComponent {
  constructor(
    injector: Injector,
    private title: Title
  ) {
    super(injector);
  }

  loggingOut = new BehaviorSubject(false);

  ngOnInit() {
    super.ngOnInit();
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.title.setTitle(this.format.appTitle);
    this.subscriptions.push(this.login.subscribeForLoggingOut(flag => this.loggingOut.next(flag)));
  }
}
