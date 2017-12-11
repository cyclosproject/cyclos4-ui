import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BaseComponent } from 'app/shared/base.component';

// Static Observable methods
import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/timer';

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

  ngOnInit() {
    super.ngOnInit();
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.title.setTitle(this.format.appTitle);
  }
}
