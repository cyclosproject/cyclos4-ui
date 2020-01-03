import { ChangeDetectionStrategy, Component, Injector, Input } from '@angular/core';
import { User } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { LabelValueKind } from 'app/shared/label-value.component';

/**
 * Shows the identification of the user over which an action will be performed.
 * Handles the following case:
 *
 * - If the user is an operator, shows a link to the owner (if not the same as the
 *   logged-in user) and the link to the operator profile.
 * - If the user is a regular user, shows a link to profile, if not the same as the logged-in user.
 */
@Component({
  selector: 'user-info',
  templateUrl: 'user-info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserInfoComponent extends BaseComponent {

  constructor(injector: Injector) {
    super(injector);
  }

  @Input() user: User;

  @Input() kind: LabelValueKind = 'view';

  @Input() labelCols: number | string;

  get operator(): boolean {
    return !!this.user.user;
  }

}
