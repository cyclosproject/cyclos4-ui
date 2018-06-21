import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { BaseComponent } from 'app/shared/base.component';
import { ContactInfosService } from 'app/api/services';
import { ContactInfoResult } from 'app/api/models';
import { ApiHelper } from 'app/shared/api-helper';
import { Action } from 'app/shared/action';
import { MatDialog } from '@angular/material';
import { ContactInfoFormComponent } from 'app/users/contact-infos/contact-info-form.component';
import { UserContactInfosListData } from 'app/api/models/user-contact-infos-list-data';

/**
 * Manages the contact-infos of a user.
 * Currently implemented only for the logged user's contact-infos
 */
@Component({
  selector: 'manage-contact-infos',
  templateUrl: 'manage-contact-infos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManageContactInfosComponent extends BaseComponent {

  loaded = new BehaviorSubject(false);
  data: UserContactInfosListData;

  constructor(
    injector: Injector,
    private dialog: MatDialog,
    private contactInfosService: ContactInfosService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.contactInfosService.getUserContactInfosListData({ user: ApiHelper.SELF })
      .subscribe(data => {
        this.data = data;
        this.loaded.next(true);
      });
  }

  actions(contactInfo: ContactInfoResult): Action[] {
    const actions: Action[] = [];
    actions.push(new Action('edit', this.messages.edit(), () => {
      this.edit(contactInfo);
    }));
    actions.push(new Action('delete', this.messages.remove(), () => {
      this.remove(contactInfo);
    }));
    return actions;
  }

  createNew() {
    this.contactInfosService.getContactInfoDataForNew({
      user: ApiHelper.SELF
    }).subscribe(forNew => {
      this.dialog.open(ContactInfoFormComponent, this.layout.formDialogConfig(forNew)).afterClosed().subscribe(saved => {
        if (saved) {
          this.notification.snackBar(this.messages.contactInfoCreated());
          this.reload();
        }
      });
    });
  }

  private remove(contactInfo: ContactInfoResult) {
    this.contactInfosService.getPasswordInputForRemoveContactInfo({ id: contactInfo.id }).subscribe(passwordInput => {
      if (passwordInput == null) {
        // No confirmation password is required: just as yes / no
        this.notification.yesNo(this.messages.contactInfoRemove(contactInfo.name))
          .subscribe(answer => {
            if (answer) {
              this.doRemove(contactInfo);
            }
          });
      } else {
        // Need to confirm with a password
        this.notification.confirmWithPassword(
          this.messages.contactInfoRemove(contactInfo.name),
          passwordInput,
          this.messages.phoneConfirmationPassword())
          .subscribe(confirmationPassword => {
            if (confirmationPassword) {
              this.doRemove(contactInfo, confirmationPassword);
            }
          });
      }
    });
  }

  private doRemove(contactInfo: ContactInfoResult, confirmationPassword: string = null) {
    this.contactInfosService.deleteContactInfo({
      id: contactInfo.id,
      confirmationPassword: confirmationPassword
    }).subscribe(() => {
      this.notification.snackBar(this.messages.contactInfoRemoved());
      this.reload();
    });
  }

  private edit(contactInfo: ContactInfoResult) {
    this.contactInfosService.getContactInfoDataForEdit({
      id: contactInfo.id
    }).subscribe(forEdit => {
      forEdit['id'] = contactInfo.id;
      this.dialog.open(ContactInfoFormComponent, this.layout.formDialogConfig(forEdit)).afterClosed().subscribe(saved => {
        if (saved) {
          this.notification.snackBar(this.messages.contactInfoModified());
          this.reload();
        }
      });
    });
  }

  private reload() {
    this.loaded.next(false);
    this.ngOnInit();
  }
}
