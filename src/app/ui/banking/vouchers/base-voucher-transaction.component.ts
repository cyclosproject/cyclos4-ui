import { Directive, Injector, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { VoucherBasicDataForTransaction, VoucherInitialDataForTransaction, VoucherTransactionPreview, VoucherTransactionResult } from 'app/api/models';
import { VouchersService } from 'app/api/services/vouchers.service';
import { ConfirmationMode } from 'app/shared/confirmation-mode';
import { validateBeforeSubmit } from 'app/shared/helper';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';
import { BehaviorSubject, Observable } from 'rxjs';

export type VoucherTransactionStep = 'token' | 'form' | 'confirm';

@Directive()
export abstract class BaseVoucherTransactionComponent<
  D extends VoucherBasicDataForTransaction,
  P extends VoucherTransactionPreview
  > extends BasePageComponent<VoucherInitialDataForTransaction> implements OnInit {

  ConfirmationMode = ConfirmationMode;

  protected vouchersService: VouchersService;

  step$ = new BehaviorSubject<VoucherTransactionStep>(null);
  userId: string;
  self: boolean;

  // Step 1: token input
  token = new FormControl('', Validators.required);
  mask = '';

  // Step 2: form
  dataForTransaction$ = new BehaviorSubject<D>(null);
  get dataForTransaction(): D {
    return this.dataForTransaction$.value;
  }
  form: FormGroup;

  // Optional step 3: confirm after preview
  preview$ = new BehaviorSubject<P>(null);
  get preview(): P {
    return this.preview$.value;
  }
  pin = new FormControl('', Validators.required);
  confirmationMode$ = new BehaviorSubject(ConfirmationMode.Password);

  get step(): VoucherTransactionStep {
    return this.step$.value;
  }
  set step(step: VoucherTransactionStep) {
    this.step$.next(step);
  }

  constructor(injector: Injector) {
    super(injector);
    this.vouchersService = injector.get(VouchersService);
  }

  ngOnInit() {
    super.ngOnInit();
    this.userId = this.route.snapshot.paramMap.get('user');
    this.addSub(this.getInitialData(this.userId).subscribe(data => {
      this.data = data;
      this.mask = this.data.mask ? this.data.mask : '';
      this.self = this.authHelper.isSelf(data.user);
    }));
    this.step = 'token';
  }

  /**
   * Setup the request to get the initial transaction data
   */
  protected abstract getInitialData(user: string): Observable<VoucherInitialDataForTransaction>;

  toForm() {
    if (!validateBeforeSubmit(this.token)) {
      return;
    }
    this.addSub(this.getVoucherTransactionData({ user: this.userId, token: this.token.value })
      .subscribe(data => {
        this.dataForTransaction$.next(data);
        this.form = new FormGroup({});
        this.setupForm(this.form, data);
        this.form.addControl('paymentCustomValues', this.fieldHelper.customValuesFormGroup(data.paymentCustomFields));
        this.step = 'form';
      }, () => this.token.reset()));
  }

  /**
   * Setup the request to get data for the transaction
   */
  protected abstract getVoucherTransactionData(params: { user: string, token: string; }): Observable<D>;

  /**
   * Prepare the form with the data
   */
  protected abstract setupForm(form: FormGroup, data: D): void;

  backToToken() {
    this.step = 'token';
    this.token.reset();
    this.form.reset();
    this.dataForTransaction$.next(null);
    this.preview$.next(null);
    this.pin.reset();
  }

  backToForm() {
    this.step = 'form';
    this.preview$.next(null);
    this.pin.reset();
  }

  resolveMenu(data: VoucherInitialDataForTransaction) {
    return this.menu.userMenu(data.user, Menu.VOUCHER_TRANSACTIONS);
  }

  maybePreview() {
    if (!validateBeforeSubmit(this.form)) {
      return;
    }
    const params = {
      user: this.dataForTransaction.user?.id,
      token: this.dataForTransaction.token,
      body: this.form.value
    };
    if (this.dataForTransaction.shouldPreview) {
      // Go th the 3rd step
      this.addSub(this.previewTransaction(params).subscribe(preview => {
        this.preview$.next(preview);
        this.step = 'confirm';
      }));
    } else {
      // We can perform the transaction
      this.performFromForm();
    }
  }

  performFromForm() {
    const data = this.dataForTransaction;
    if (!this.validatePerformFromForm(data, this.form)) {
      return;
    }
    const params = {
      user: data.user.id,
      token: data.token,
      body: this.form.value
    };
    this.addSub(this.performTransaction(null, params).subscribe(result => {
      this.router.navigate(['/banking', 'voucher-transactions', 'view', result.id], { state: { url: this.router.url } });
    }));
  }

  performFromPreview() {
    if (!this.validatePerformFromPreview(this.preview)) {
      return;
    }
    const params = {
      user: this.preview.user.id,
      token: this.preview.token
    };
    this.addSub(this.performTransaction(this.preview, params).subscribe(result => {
      this.router.navigate(['/banking', 'voucher-transactions', 'view', result.id], { state: { url: this.router.url } });
    }));
  }

  /**
   * Setup the request for the transaction preview
   */
  protected abstract previewTransaction(params: { user: string, token: string, body: any; }): Observable<P>;

  /**
   * Performs the voucher transaction itself. If preview is null it means there was no preview step
   * The body param will be empty when fromPreview is true.
   */
  protected abstract performTransaction(preview: P | null, params: { user: string, token: string, body?: any; }): Observable<VoucherTransactionResult>;

  /**
   * Validates the attempt to perform the transaction from the form step
   */
  protected abstract validatePerformFromForm(data: D, form: FormGroup): boolean;

  /**
   * Validates the attempt to perform the transaction from the preview step
   */
  protected abstract validatePerformFromPreview(preview: P): boolean;
}
