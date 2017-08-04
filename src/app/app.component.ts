import { Component, ChangeDetectionStrategy } from '@angular/core';
import { GeneralMessages } from "app/messages/general-messages";
import { LayoutService } from "app/core/layout.service";
import { Subscription } from "rxjs/Subscription";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  constructor(
    public generalMessages: GeneralMessages,
    public layout: LayoutService
  ) { }
}
