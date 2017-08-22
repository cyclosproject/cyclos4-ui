import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';
import { Title } from "@angular/platform-browser";
import { GeneralMessages } from "app/messages/general-messages";
import { LayoutService } from "app/core/layout.service";
import { Subscription } from "rxjs/Subscription";
import { BaseComponent } from "app/shared/base.component";

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
    this.title.setTitle(this.format.appTitle);
  }
}
