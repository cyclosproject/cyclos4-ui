import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Injector, Output } from '@angular/core';
import { SvgIcon } from 'app/core/svg-icon';
import { blurIfClick } from 'app/shared/helper';
import { VoucherBaseComponent } from 'app/voucher/voucher-base.component';

/**
 * The top bar contains the sidenav launcher ('hamburger' icon) and the 'Exit' action. 
 * It's shown only for smal devices (xxs and xs breakpoints)
 * 
 * =============== IMPORTANT ==================================================
 * We use 'top-bar' as the tag name instead of the expected 'voucher-top-bar' because there are some CSS styles
 * tied to the tag name (see _layout.scss).
 * We tried to change the styles to use a class name but it breaks other styles ;(
 */
@Component({
  selector: 'top-bar',
  templateUrl: 'voucher-top-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoucherTopBarComponent extends VoucherBaseComponent {
  SvgIcon = SvgIcon;
  blurIfClick = blurIfClick;

  @HostBinding('class.has-top-bar') hasTopBar = true;
  @Output() toggleSidenav = new EventEmitter<void>();

  constructor(injector: Injector) {
    super(injector);
  }
}
