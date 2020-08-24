import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Currency, VoucherDataForGenerate, VoucherTypeDetailed } from 'app/api/models';
import { VouchersService } from 'app/api/services/vouchers.service';
import { ConfirmationMode } from 'app/shared/confirmation-mode';
import { validateBeforeSubmit } from 'app/shared/helper';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';
import { BehaviorSubject } from 'rxjs';

export type GenerateVouchersStep = 'select-type' | 'form' | 'confirm';

/**
 * Component used to generate vouchers.
 * The data requested for the first time is to get all possible voucher types.
 */
@Component({
  selector: 'generate-vouchers',
  templateUrl: 'generate-vouchers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenerateVouchersComponent extends BasePageComponent<VoucherDataForGenerate>
  implements OnInit {

  ConfirmationMode = ConfirmationMode;

  step$ = new BehaviorSubject<GenerateVouchersStep>(null);

  singleType = false;
  form: FormGroup;

  confirmationPassword: FormControl;
  confirmationMode$ = new BehaviorSubject<ConfirmationMode>(null);

  // The data for a specific voucher type
  dataTypeForGenerate: VoucherDataForGenerate;
  canConfirm: boolean;

  constructor(injector: Injector, private voucherService: VouchersService) {
    super(injector);
  }

  get step(): GenerateVouchersStep {
    return this.step$.value;
  }
  set step(step: GenerateVouchersStep) {
    this.step$.next(step);
  }

  ngOnInit() {
    super.ngOnInit();
    this.addSub(this.voucherService.getVoucherDataForGenerate().subscribe(data => this.data = data));
  }

  onDataInitialized(data: VoucherDataForGenerate) {
    const types = data.types || [];
    if (types.length === 1) {
      this.singleType = true;
      this.toForm(types[0]);
    } else {
      this.step = 'select-type';
    }
  }

  get currency(): Currency {
    return this.dataTypeForGenerate.account.currency;
  }

  /**
   * Final action: generate the vouchers
   */
  generate(confirmationPassword?: string) {
    if (confirmationPassword) {
      this.confirmationPassword.setValue(confirmationPassword);
    }

    if (this.confirmationPasswordInput && !validateBeforeSubmit(this.confirmationPassword)) {
      return;
    }

    const body = this.form.value;
    body.type = this.dataTypeForGenerate.type.id;
    delete body.userData;
    const params = {
      confirmationPassword: this.confirmationPasswordInput ? this.confirmationPassword.value : null,
      body,
    };
    this.addSub(
      this.voucherService.generateVouchers(params)
        .subscribe(() => {
          this.reload();
          this.notification.snackBar(this.i18n.voucher.generate.done);
        }),
    );
  }

  backToSelectType() {
    this.step = 'select-type';
  }

  backToForm() {
    this.step = 'form';
  }

  /**
   * Go to second step
   */
  toForm(type: VoucherTypeDetailed): void {
    this.addSub(this.voucherService.getVoucherDataForGenerate({ type: type.id })
      .subscribe(data => {
        this.dataTypeForGenerate = data;
        this.buildForm();
        this.step = 'form';
      }),
    );
  }

  /**
   * Go to third step
   */
  toConfirm(): void {
    if (!validateBeforeSubmit(this.form)) {
      return;
    }

    this.canConfirm = this.authHelper.canConfirm(this.confirmationPasswordInput);
    if (!this.canConfirm) {
      this.notification.warning(this.authHelper.getConfirmationMessage(this.confirmationPasswordInput));
      return;
    } else if (this.confirmationPasswordInput) { // can confirm and confirmation is required
      if (!this.confirmationPassword) {
        // The confirmation password is hold in a separated control
        this.confirmationPassword = this.formBuilder.control(null);
        this.confirmationPassword.setValidators(Validators.required);
      } else {
        this.confirmationPassword.reset();
      }
    }
    this.step = 'confirm';
  }

  private get confirmationPasswordInput() {
    return this.dataTypeForGenerate.confirmationPasswordInput;
  }

  private buildForm(): void {
    if (this.form) {
      this.form.reset(); // clear previous values (if any)
    } else {
      this.form = this.formBuilder.group({
        count: new FormControl(''),
        amount: new FormControl(''),
        user: new FormControl(''),
        userData: new FormControl('') // Used to get the user info in the confirmation page
      });
    }

    this.form.get('count').setValue(1);
  }

  resolveMenu() {
    return Menu.GENERATE_VOUCHER;
  }
}
