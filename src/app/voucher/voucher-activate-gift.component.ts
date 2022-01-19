import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivateGiftVoucher } from 'app/api/models';
import { focus, validateBeforeSubmit } from 'app/shared/helper';
import { VoucherBasePageComponent } from 'app/voucher/voucher-base-page.component';
import { BehaviorSubject } from 'rxjs';

/**
 * Component used to activate a gift voucher with PIN
 */
@Component({
  selector: 'voucher-activate-gift',
  templateUrl: 'voucher-activate-gift.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VoucherActivateGiftComponent extends VoucherBasePageComponent implements OnInit {

  focus = focus;
  form: FormGroup;
  enableNotifications$ = new BehaviorSubject(true);

  constructor(
    injector: Injector, private formBuilder: FormBuilder) {
    super(injector);
  }

  ngOnInit(): void {
    super.ngOnInit();

    const emailRequired: ValidatorFn = control => {
      const enableNotifications = control?.parent?.value?.enableNotifications;
      if (!enableNotifications) {
        return null;
      }
      // Notifications are enabled
      if (this.state.voucher.phoneConfiguration) {
        // Phone is also available - not required
        return null;
      }
      return Validators.required(control);
    };

    const pin = this.formBuilder.group({
      newPin: ['', Validators.required],
      newPinConfirmation: ['', Validators.required]
    });
    const notification = this.formBuilder.group({
      enableNotifications: this.enableNotifications$.value,
      email: ['', Validators.compose([emailRequired, Validators.email])],
      mobilePhone: ['']
    });
    notification.get('enableNotifications').valueChanges.subscribe(v => this.enableNotifications$.next(v));
    this.form = new FormGroup({
      pin, notification
    });

    // Add shortcuts
    this.addEscapeShortcut(() => this.state.exit());

    // Set page title
    this.state.title = this.i18n.voucher.info.activateGift.title;
  }

  proceed() {
    if (this.state.processing$.value) {
      return;
    }
    if (!validateBeforeSubmit(this.form)) {
      return;
    } else {

      const activateGift = this.form.value as ActivateGiftVoucher;
      activateGift.pin.checkPinConfirmation = true;

      this.voucherService.activateGiftVoucher({ token: this.state.token, body: activateGift }).subscribe(data => {
        this.state.voucher = data;
        this.router.navigate(['details']);
      });
    }

  }
}
