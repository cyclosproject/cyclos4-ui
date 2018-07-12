import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { BaseComponent } from 'app/shared/base.component';
import { PhonesService } from 'app/api/services';
import { UserPhonesListData, PhoneResult, PhoneKind } from 'app/api/models';
import { ApiHelper } from 'app/shared/api-helper';
import { Action } from 'app/shared/action';
import { MatDialog } from '@angular/material';
import { PhoneFormComponent } from 'app/users/phones/phone-form.component';
import { VerifyPhoneComponent } from 'app/users/phones/verify-phone.component';

/**
 * Manages the phones of a user.
 * Currently implemented only for the logged user's phones
 */
@Component({
  selector: 'manage-phones',
  templateUrl: 'manage-phones.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagePhonesComponent extends BaseComponent {

  loaded = new BehaviorSubject(false);
  data: UserPhonesListData;
  createActions: Action[];

  constructor(
    injector: Injector,
    private dialog: MatDialog,
    private phonesService: PhonesService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.phonesService.getUserPhonesListData({ user: ApiHelper.SELF })
      .subscribe(data => {
        this.data = data;
        this.createActions = [];
        if (data.canCreateMobile) {
          this.createActions.push(this.createAction(PhoneKind.MOBILE));
        }
        if (data.canCreateLandLine) {
          this.createActions.push(this.createAction(PhoneKind.LAND_LINE));
        }
        this.loaded.next(true);
      });
  }

  private createAction(kind: PhoneKind): Action {
    const label = kind === PhoneKind.MOBILE ? this.messages.phoneNewMobile() : this.messages.phoneNewLandLine();
    return new Action(this.icon(kind), label, () => {
      this.phonesService.getPhoneDataForNew({
        user: ApiHelper.SELF,
        type: kind
      }).subscribe(forNew => {
        this.dialog.open(PhoneFormComponent, this.layout.formDialogConfig(forNew)).afterClosed().subscribe(saved => {
          if (saved) {
            this.notification.snackBar(this.messages.phoneCreated());
            this.reload();
          }
        });
      });
    });
  }

  actions(phone: PhoneResult): Action[] {
    const actions: Action[] = [];
    actions.push(new Action('edit', this.messages.edit(), () => {
      this.edit(phone);
    }));
    if (phone.type === PhoneKind.MOBILE) {
      if (phone.verified) {
        if (this.data.canEnableForSms) {
          if (phone.enabledForSms) {
            actions.push(new Action('sms_failed', this.messages.phoneDisableSms(), () => {
              this.disableForSms(phone);
            }));
          } else {
            actions.push(new Action('sms', this.messages.phoneEnableSms(), () => {
              this.enableForSms(phone);
            }));
          }
        }
      } else if (this.data.canVerify) {
        actions.push(new Action('verified_user', this.messages.phoneVerify(), () => {
          this.verify(phone);
        }));
      }
    }
    actions.push(new Action('delete', this.messages.remove(), () => {
      this.remove(phone);
    }));
    return actions;
  }

  private enableForSms(phone: PhoneResult) {
    this.phonesService.enablePhoneForSms(phone.id).subscribe(() => {
      this.notification.snackBar(this.messages.phoneEnabledSms(phone.number));
      this.reload();
    });
  }

  private disableForSms(phone: PhoneResult) {
    this.phonesService.getPasswordInputForDisablePhoneForSms({ id: phone.id }).subscribe(passwordInput => {
      if (passwordInput == null) {
        // No confirmation password is required: just as yes / no
        this.notification.yesNo(this.messages.phoneDisableSmsConfirm(phone.number))
          .subscribe(answer => {
            if (answer) {
              this.doDisableSms(phone);
            }
          });
      } else {
        // Need to confirm with a password
        this.notification.confirmWithPassword(
          this.messages.phoneDisableSmsConfirm(phone.number),
          passwordInput,
          this.messages.phoneConfirmationPassword())
          .subscribe(confirmationPassword => {
            if (confirmationPassword) {
              this.doDisableSms(phone, confirmationPassword);
            }
          });
      }
    });
  }

  private verify(phone: PhoneResult) {
    if (!phone.verified && this.data.canVerify) {
      this.dialog.open(VerifyPhoneComponent, this.layout.formDialogConfig(phone)).afterClosed().subscribe(verified => {
        if (verified) {
          this.notification.snackBar(this.messages.phoneVerified());
          this.reload();
        }
      });
    }
  }

  private remove(phone: PhoneResult) {
    this.phonesService.getPasswordInputForRemovePhone({ id: phone.id }).subscribe(passwordInput => {
      if (passwordInput == null) {
        // No confirmation password is required: just as yes / no
        this.notification.yesNo(this.messages.phoneRemove(phone.number))
          .subscribe(answer => {
            if (answer) {
              this.doRemove(phone);
            }
          });
      } else {
        // Need to confirm with a password
        this.notification.confirmWithPassword(
          this.messages.phoneRemove(phone.number),
          passwordInput,
          this.messages.phoneConfirmationPassword())
          .subscribe(confirmationPassword => {
            if (confirmationPassword) {
              this.doRemove(phone, confirmationPassword);
            }
          });
      }
    });
  }

  private doRemove(phone: PhoneResult, confirmationPassword: string = null) {
    this.phonesService.deletePhone({
      id: phone.id,
      confirmationPassword: confirmationPassword
    }).subscribe(() => {
      this.notification.snackBar(this.messages.phoneRemoved());
      this.reload();
    });
  }

  private doDisableSms(phone: PhoneResult, confirmationPassword: string = null) {
    this.phonesService.disablePhoneForSms({
      id: phone.id,
      confirmationPassword: confirmationPassword
    }).subscribe(() => {
      this.notification.snackBar(this.messages.phoneDisabledSms(phone.number));
      this.reload();
    });
  }

  private edit(phone: PhoneResult) {
    this.phonesService.getPhoneDataForEdit({
      id: phone.id
    }).subscribe(forEdit => {
      forEdit['id'] = phone.id;
      this.dialog.open(PhoneFormComponent, this.layout.formDialogConfig(forEdit)).afterClosed().subscribe(saved => {
        if (saved) {
          this.notification.snackBar(this.messages.phoneModified());
          this.reload();
        }
      });
    });
  }

  icon(kind: PhoneKind): string {
    return kind === 'mobile' ? 'smartphone' : 'phone';
  }

  private reload() {
    this.loaded.next(false);
    this.ngOnInit();
  }
}
