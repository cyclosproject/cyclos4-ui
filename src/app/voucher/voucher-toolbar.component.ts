import { ChangeDetectionStrategy, Component, Injector, Input } from '@angular/core';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { VoucherBaseComponent } from 'app/voucher/voucher-base.component';

/**
 * Simple toolbar containing heading actions.
 * It groups the actions into two groups: the actions on the left and the actions on the right.
 */
@Component({
  selector: 'voucher-toolbar',
  templateUrl: 'voucher-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VoucherToolbarComponent extends VoucherBaseComponent {
  SvgIcon = SvgIcon;

  @Input() leftHeadingActions: HeadingAction[] = [];
  @Input() rightHeadingActions: HeadingAction[] = [];

  constructor(injector: Injector) {
    super(injector);
  }
}
