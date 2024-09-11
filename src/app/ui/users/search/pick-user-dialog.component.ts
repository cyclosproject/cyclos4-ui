import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, Output, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { BaseComponent } from 'app/shared/base.component';
import { validateBeforeSubmit } from 'app/shared/helper';
import { UserFieldComponent } from 'app/shared/user-field.component';
import { BsModalRef } from 'ngx-bootstrap/modal';

/**
 * A component to be shown in a dialog, allowing the user to select another user
 */
@Component({
  selector: 'pick-user-dialog',
  templateUrl: 'pick-user-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PickUserDialogComponent extends BaseComponent {
  @Input() title: string;
  @Input() label: string;
  @Input() excludeContacts: boolean;
  @Input() excludedUsers: string[];
  @Input() allowPrincipal = false;
  @Input() allowSearch = true;
  @Input() hideAfterSubmit = true;

  @Output() done = new EventEmitter<any>();
  @ViewChild('field', { static: true }) field: UserFieldComponent;

  control = new FormControl(null, Validators.required);

  constructor(injector: Injector, public modalRef: BsModalRef) {
    super(injector);
  }

  add() {
    if (!validateBeforeSubmit(this.control)) {
      return;
    }
    const user = this.field.selection;
    this.done.emit(user ? user : this.control.value);
    if (this.hideAfterSubmit) {
      this.modalRef.hide();
    }
  }

  clear() {
    this.control.reset(null, { emitEvent: false });
  }
}
