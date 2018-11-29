import { ChangeDetectionStrategy, Component, Injector } from '@angular/core';
import { ContentService } from 'app/core/content.service';
import { BaseComponent } from 'app/shared/base.component';
import { environment } from 'environments/environment';

/**
 * The home page for logged users
 */
@Component({
  selector: 'user-home',
  templateUrl: 'user-home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserHomeComponent extends BaseComponent {

  content = environment.usersHome;

  constructor(
    injector: Injector,
    public contentService: ContentService) {
    super(injector);
  }
}
