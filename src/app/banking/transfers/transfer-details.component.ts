import { Component, ChangeDetectionStrategy, Injector, Input } from '@angular/core';

import { TransferView, Transfer } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { ApiHelper } from 'app/shared/api-helper';

/**
 * Displays fields of a transfer or payment
 */
@Component({
  selector: 'transfer-details',
  templateUrl: 'transfer-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransferDetailsComponent extends BaseComponent {

  @Input() transfer: TransferView;

  constructor(
    injector: Injector) {
    super(injector);
  }

  path(transfer: Transfer): string[] {
    return ['/banking', 'transfer', ApiHelper.transactionNumberOrId(transfer)];
  }
}
