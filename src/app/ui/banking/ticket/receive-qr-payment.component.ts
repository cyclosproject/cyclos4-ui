import { ChangeDetectionStrategy, Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { AvailabilityEnum, DataForTransaction, ImageSizeEnum, TransactionTypeData, TransactionView, TransferType } from 'app/api/models';
import { TicketsService } from 'app/api/services/tickets.service';
import { BankingHelperService } from 'app/ui/core/banking-helper.service';
import { PushNotificationsService } from 'app/core/push-notifications.service';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { empty, shareSupported, validateBeforeSubmit } from 'app/shared/helper';
import { Menu } from 'app/ui/shared/menu';
import { BehaviorSubject, Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { ApiHelper } from 'app/shared/api-helper';

export type Step = 'form' | 'pending';

/**
 * Generates a QR-code which can be scanned and paid
 */
@Component({
  selector: 'receive-qr-payment',
  templateUrl: 'receive-qr-payment.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiveQrPaymentComponent
  extends BasePageComponent<DataForTransaction>
  implements OnInit, OnDestroy {

  step$ = new BehaviorSubject<Step>(null);
  form: FormGroup;
  ticket$ = new BehaviorSubject<TransactionView>(null);
  paymentTypes$ = new BehaviorSubject<TransferType[]>([]);
  paymentType$ = new BehaviorSubject<TransferType>(null);
  paymentTypeData$ = new BehaviorSubject<TransactionTypeData>(null);
  private paymentTypeDataCache = new Map<string, TransactionTypeData>();
  private pushSub: Subscription;
  qrCodeUrl$ = new BehaviorSubject<string>(null);

  supportsShare = shareSupported();

  constructor(
    injector: Injector,
    private ticketsService: TicketsService,
    private pushNotifications: PushNotificationsService,
    private bankingHelper: BankingHelperService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.addSub(this.ticketsService.dataForNewTicket({ user: ApiHelper.SELF }).subscribe(data => this.data = data));
    this.addSub(this.step$.subscribe(step => this.onStepChanged(step)));
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this.unsubscribePush();
    this.destroyQrCode();
  }

  onDataInitialized(data: DataForTransaction) {
    if (empty(data.accounts) || empty(data.paymentTypes)) {
      // No accounts
      this.notification.error(this.bankingHelper.noAccountForPaymentErrorMessage());
    } else {
      // Create the form
      this.form = this.formBuilder.group({
        account: [null, Validators.required],
        type: [null, Validators.required],
        amount: [null, Validators.required],
        description: null
      });

      this.paymentTypeDataCache.set(data.paymentTypes[0].id, data.paymentTypeData);
      this.addSub(this.form.controls.type.valueChanges.pipe(distinctUntilChanged()).subscribe(id => this.onPaymentTypeChange(id)));
      this.addSub(this.form.controls.account.valueChanges.pipe(distinctUntilChanged()).subscribe(id => this.onAccountChange(id, data)));
      this.form.patchValue({ account: data.accounts[0].id });
      this.step$.next('form');
    }
  }

  onAccountChange(id: string, data: DataForTransaction) {
    const account = data.accounts.find(a => a.id === id);
    const paymentTypes = account ? data.paymentTypes.filter(tt => tt.to.id === account.type.id) : [];
    this.paymentTypes$.next(paymentTypes);
    this.form.patchValue({ type: paymentTypes.length === 0 ? null : paymentTypes[0].id });
    if (paymentTypes.length === 0) {
      return;
    }
  }

  onPaymentTypeChange(id: string) {
    const type = ((this.paymentTypes$.value) || []).find(t => t.id === id);
    if (!type) {
      this.notification.error(this.i18n.transaction.noTypes);
      return;
    }
    const set = (d: TransactionTypeData) => {
      if ((this.paymentType$.value || {}).id !== id) {
        this.paymentTypeDataCache.set(id, d);
        this.paymentType$.next(type);
        this.paymentTypeData$.next(d);
        this.form.setControl('customValues', this.fieldHelper.customValuesFormGroup(d.customFields));
        this.form.controls.type.setValidators(d.descriptionAvailability === AvailabilityEnum.REQUIRED ? Validators.required : null);
        if (d?.fixedAmount) {
          this.form.patchValue({ amount: d.fixedAmount });
        }
      }
    };
    const cached = this.paymentTypeDataCache.get(id);
    if (cached) {
      set(cached);
    } else {
      this.addSub(this.ticketsService.dataForNewTicket({
        user: ApiHelper.SELF,
        type: id
      }).subscribe(data => {
        set(data.paymentTypeData);
      }));
    }
  }

  toPending() {
    if (!validateBeforeSubmit(this.form)) {
      return;
    }
    this.addSub(this.ticketsService.newTicket({
      user: ApiHelper.SELF,
      body: this.form.value
    }).subscribe(ticket => {
      this.ticket$.next(ticket);

      this.addSub(this.ticketsService.getTicketQrCode({
        ticket:
          ticket.ticketNumber,
        size: ImageSizeEnum.MEDIUM
      }).subscribe(qrCode => {
        this.qrCodeUrl$.next(URL.createObjectURL(qrCode));
      }));

      this.step$.next('pending');
    }));
  }

  private onStepChanged(step: Step) {
    if (step === 'pending') {
      this.pushSub = this.pushNotifications.ticket$.subscribe(ticket => {
        const current = this.ticket$.value;
        if (current && current.id === ticket.id) {
          this.router.navigate(['/banking', 'transaction', this.bankingHelper.transactionNumberOrId(ticket.transaction)],
            { state: { url: this.router.url } });
        }
      });
    } else {
      this.unsubscribePush();
      this.destroyQrCode();
    }
  }

  private unsubscribePush() {
    if (this.pushSub) {
      this.pushSub.unsubscribe();
      this.pushSub = null;
    }
  }

  private destroyQrCode() {
    if (this.qrCodeUrl$.value) {
      URL.revokeObjectURL(this.qrCodeUrl$.value);
      this.qrCodeUrl$.next(null);
    }
  }

  share() {
    const ticket = this.ticket$.value;
    if (navigator['share']) {
      navigator['share']({
        url: ticket.approveUrl,
        title: this.i18n.transaction.ticketShareTitle,
        text: this.i18n.transaction.ticketShareText({
          user: ticket.to.user.display,
          amount: this.format.formatAsCurrency(ticket.currency, ticket.amount)
        })
      });
    } else {

    }
  }

  resolveMenu() {
    return Menu.RECEIVE_QR_PAYMENT;
  }
}
