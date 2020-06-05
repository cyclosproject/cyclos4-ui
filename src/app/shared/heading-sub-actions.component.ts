import { ChangeDetectionStrategy, Component, Injector, Input } from '@angular/core';
import { HeadingAction } from 'app/shared/action';
import { BaseComponent } from 'app/shared/base.component';
import { BsModalRef } from 'ngx-bootstrap/modal';

/**
 * Used in a popup to assign a token
 */
@Component({
  selector: 'heading-sub-actions',
  templateUrl: 'heading-sub-actions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeadingSubActionsComponent extends BaseComponent {

  @Input() action: HeadingAction;

  constructor(
    injector: Injector,
    public modalRef: BsModalRef) {
    super(injector);
  }
}
