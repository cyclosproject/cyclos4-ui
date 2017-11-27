import { Component, ChangeDetectionStrategy, Injector, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { GeneralMessages } from 'app/messages/general-messages';
import { LayoutService } from 'app/core/layout.service';
import { Subscription } from 'rxjs/Subscription';
import { BaseComponent } from 'app/shared/base.component';
import { PersonalMenuComponent } from 'app/core/personal-menu.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent extends BaseComponent {
  constructor(
    injector: Injector,
    private title: Title,
    private router: Router
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.title.setTitle(this.format.appTitle);
  }
}
