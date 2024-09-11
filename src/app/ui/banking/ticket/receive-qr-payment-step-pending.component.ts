import { ChangeDetectionStrategy, Component, Injector, Input } from '@angular/core';
import { TransactionView } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { copyToClipboard, shareSupported } from 'app/shared/helper';

/**
 * Receive QR payment step: pending ticket confirmation
 */
@Component({
  selector: 'receive-qr-payment-step-pending',
  templateUrl: 'receive-qr-payment-step-pending.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReceiveQrPaymentStepPendingComponent extends BaseComponent {
  @Input() ticket: TransactionView;
  @Input() qrCodeUrl: string;

  supportsShare = shareSupported();

  constructor(injector: Injector) {
    super(injector);
  }

  copyUrl() {
    copyToClipboard(this.ticket.approveUrl);
    this.notification.snackBar(this.i18n.general.copyToClipboardDone);
  }
}
