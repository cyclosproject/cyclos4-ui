import { ChangeDetectionStrategy, Component, Injector } from '@angular/core';
import { ContentService } from 'app/core/content.service';
import { BaseComponent } from 'app/shared/base.component';
import { environment } from 'environments/environment';

/**
 * The home page for guests
 */
@Component({
  selector: 'guest-home',
  templateUrl: 'guest-home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GuestHomeComponent extends BaseComponent {

  mobileContent = environment.guestsMobileHome;
  desktopContent = environment.guestsDesktopHome;

  constructor(
    injector: Injector,
    public contentService: ContentService) {
    super(injector);
  }
}
