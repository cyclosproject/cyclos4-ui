import { Component, ChangeDetectionStrategy, Injector, Input, OnInit } from '@angular/core';

import { TransferView, Transfer } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { ApiHelper } from 'app/shared/api-helper';
import { empty } from 'app/shared/helper';

/**
 * Displays fields of a transfer or payment
 */
@Component({
  selector: 'transfer-details',
  templateUrl: 'transfer-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransferDetailsComponent extends BaseComponent implements OnInit {

  @Input() transfer: TransferView;
  lastAuthComment: string;

  constructor(
    injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const transaction = this.transfer.transaction || {};
    if (!empty(transaction.authorizations)) {
      this.lastAuthComment = transaction.authorizations[0].comments;
    }
  }

  path(transfer: Transfer): string[] {
    return ['/banking', 'transfer', ApiHelper.transactionNumberOrId(transfer)];
  }
}
