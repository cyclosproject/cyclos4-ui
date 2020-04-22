import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Output, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { User } from 'app/api/models';
import { ContactsService } from 'app/api/services';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseComponent } from 'app/shared/base.component';
import { validateBeforeSubmit } from 'app/shared/helper';
import { UserFieldComponent } from 'app/shared/user-field.component';
import { BsModalRef } from 'ngx-bootstrap/modal';

/**
 * A component to be shown in a dialog, allowing the user to add a contact
 */
@Component({
  selector: 'add-contact-dialog',
  templateUrl: 'add-contact-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddContactDialogComponent extends BaseComponent {

  @Output() done = new EventEmitter<User>();
  @ViewChild('field', { static: true }) field: UserFieldComponent;

  control = new FormControl(null, Validators.required);

  constructor(
    injector: Injector,
    public modalRef: BsModalRef,
    private contactsService: ContactsService,
  ) {
    super(injector);
  }

  addContact() {
    validateBeforeSubmit(this.control);
    if (!this.control.valid) {
      return;
    }
    const user = this.field.selection;
    this.addSub(this.contactsService.createContact({
      user: ApiHelper.SELF,
      body: {
        contact: this.control.value,
      },
    }).subscribe(() => {
      this.done.emit(user);
      this.modalRef.hide();
    }));
  }

}
