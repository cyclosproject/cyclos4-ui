import { ChangeDetectionStrategy, Component, ElementRef, Injector, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { VoucherDataForRedeem, VoucherInitialDataForRedeem } from 'app/api/models';
import { VouchersService } from 'app/api/services';
import { BasePageComponent } from 'app/shared/base-page.component';
import { focus, validateBeforeSubmit } from 'app/shared/helper';
import { InputFieldComponent } from 'app/shared/input-field.component';
import { Menu } from 'app/shared/menu';
import { ScanQrCodeComponent } from 'app/shared/scan-qrcode.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';

export type RedeemStep = 'form' | 'confirm';

@Component({
  selector: 'app-redeem-voucher',
  templateUrl: './redeem-voucher.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RedeemVoucherComponent extends BasePageComponent<VoucherInitialDataForRedeem> implements OnInit {

  step$ = new BehaviorSubject<RedeemStep>(null);
  token = new FormControl('', Validators.required);
  mask = '';
  dataForRedeem$ = new BehaviorSubject<VoucherDataForRedeem>(null);
  form: FormGroup;
  userId: string;
  self: boolean;

  @ViewChild('inputField') inputField: ElementRef<InputFieldComponent>;

  get dataForRedeem(): VoucherDataForRedeem {
    return this.dataForRedeem$.value;
  }

  set dataForRedeem(dataForRedeem: VoucherDataForRedeem) {
    this.dataForRedeem$.next(dataForRedeem);
  }

  constructor(
    injector: Injector,
    private voucherService: VouchersService,
    private modal: BsModalService,
  ) {
    super(injector);
  }

  get step(): RedeemStep {
    return this.step$.value;
  }
  set step(step: RedeemStep) {
    this.step$.next(step);
  }

  submit() {
    if (this.step === 'form') {
      if (!validateBeforeSubmit(this.token)) {
        return;
      }

      this.addSub(this.voucherService.getVoucherDataForRedeem({ user: this.userId, token: this.token.value })
        .subscribe(data => {
          this.dataForRedeem = data;
          // Custom fields
          this.form = this.fieldHelper.customValuesFormGroup(this.dataForRedeem.customFields);
          this.step = 'confirm';
        }));
    } else {
      const params = { user: this.userId, token: this.token.value, body: { customValues: this.form.value } };
      this.addSub(this.voucherService.redeemVoucher(params)
        .subscribe(data => {
          this.router.navigate(['banking', 'vouchers', data.voucherId]);
          this.notification.info(this.i18n.voucher.redeem.done);
        }));
    }
  }

  backToForm() {
    this.step = 'form';
  }

  ngOnInit() {
    super.ngOnInit();
    this.userId = this.route.snapshot.paramMap.get('user');
    this.addSub(this.voucherService.getVoucherInitialDataForRedeem({ user: this.userId }).subscribe(data => {
      this.data = data;
      this.mask = this.data.mask ? this.data.mask : '';
      this.self = this.authHelper.isSelf(data.user);
    }));
    this.step = 'form';
  }

  reload() {
    this.step = 'form';
    super.reload();
  }

  resolveMenu(data: VoucherInitialDataForRedeem) {
    return this.authHelper.userMenu(data.user, Menu.REDEEM_VOUCHER);
  }

  showScanQrCode() {
    const ref = this.modal.show(ScanQrCodeComponent, {
      class: 'modal-form',
    });
    const component = ref.content as ScanQrCodeComponent;
    component.select.pipe(first()).subscribe(value => {
      this.token.setValue(value);
      this.submit();
    });
    this.modal.onHide.pipe(first()).subscribe(() => focus(this.inputField, true));
  }
}
