import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { SimpleChangeVoucherPin } from 'app/api/models';
import { validateBeforeSubmit } from 'app/shared/helper';
import { VoucherBasePageComponent } from 'app/voucher/voucher-base-page.component';

@Component({
  selector: "voucher-change-pin",
  templateUrl: 'voucher-change-pin.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VoucherChangePinComponent extends VoucherBasePageComponent implements OnInit {
  form: FormGroup;

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.buildForm();
    this.addEnterShortcut(() => this.confirm());
    this.addEscapeShortcut(() => this.cancel());
    this.title = this.i18n.voucher.info.changePin.title;
  }

  confirm() {
    if (!validateBeforeSubmit(this.form)) {
      return;
    }
    const changePin = this.form.value as SimpleChangeVoucherPin;
    changePin.checkPinConfirmation = true;
    this.voucherService.changeVoucherInfoPin({ token: this.state.token, pin: (this.form.value as { oldPin: string; }).oldPin, body: changePin })
      .subscribe(_resp => {
        this.notification.snackBar(this.i18n.voucher.info.changePin.pinChanged);
        //update the PIN in memory for subsequent requests
        this.state.updatePin(changePin.newPin);
        this.router.navigate(["details"]);
      });
  }

  cancel() {
    this.router.navigate(['/details']);
  }

  private buildForm() {
    this.form = new FormBuilder().group({
      oldPin: new FormControl('', Validators.required),
      newPin: new FormControl('', Validators.required),
      newPinConfirmation: new FormControl('', Validators.required),
    });
  }
}