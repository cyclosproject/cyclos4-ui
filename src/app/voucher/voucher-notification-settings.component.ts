import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ChangeVoucherNotificationSettings } from 'app/api/models';
import { validateBeforeSubmit } from 'app/shared/helper';
import { VoucherBasePageComponent } from 'app/voucher/voucher-base-page.component';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'voucher-notification-settings',
  templateUrl: 'voucher-notification-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VoucherNotificationSettingsComponent extends VoucherBasePageComponent implements OnInit {
  form: FormGroup;
  emailRequired$ = new BehaviorSubject(false);

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.buildForm();
    this.addEnterShortcut(() => this.confirm());
    this.addEscapeShortcut(() => this.cancel());
    this.title = this.i18n.voucher.notificationSettings.title;
    this.emailRequired$.next(this.isEmailRequired());
  }

  confirm() {
    if (!validateBeforeSubmit(this.form)) {
      return;
    }
    const settings: ChangeVoucherNotificationSettings = this.form.value;
    this.voucherService
      .changeVoucherInfoNotificationSettings({
        token: this.state.token,
        pin: this.state.pin,
        body: settings
      })
      .subscribe(_resp => {
        this.notification.snackBar(this.i18n.voucher.notificationSettings.done);
        this.state.updateNotificationSettings(settings);
        this.router.navigate(['details']);
      });
  }

  cancel() {
    this.router.navigate(['/details']);
  }

  isEmailRequired() {
    const enableNotifications = this.form.get('enableNotifications').value;
    return this.state.isSent() || (enableNotifications && !this.state.voucher.phoneConfiguration);
  }

  private buildForm() {
    const email = new FormControl(this.state.voucher.email, control => {
      const currVal = control.value;
      if (control.touched && !currVal && this.isEmailRequired()) {
        return {
          required: true
        };
      }
      return null;
    });
    const mobilePhone = new FormControl(this.state.voucher.mobilePhone);
    const enableNotifications = new FormControl(this.state.voucher.notificationsEnabled);
    enableNotifications.valueChanges.subscribe(() => this.emailRequired$.next(this.isEmailRequired()));

    this.form = new FormGroup({ email, mobilePhone, enableNotifications });
  }
}
