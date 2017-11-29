import { Component, OnInit, Injector, ChangeDetectionStrategy, Input } from '@angular/core';
import { BaseBankingComponent } from 'app/banking/base-banking.component';
import { TransferView } from 'app/api/models/transfer-view';
import { ApiHelper } from 'app/shared/api-helper';
import { Transfer } from 'app/api/models';
import { TableDataSource } from 'app/shared/table-datasource';

/**
 * Component that shows details of a transfer
 */
@Component({
  selector: 'view-transfer-details',
  templateUrl: './view-transfer-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewTransferDetailsComponent extends BaseBankingComponent {
  constructor(
    injector: Injector
  ) {
    super(injector);
  }

  @Input()
  transfer: TransferView;

  childrenDataSource = new TableDataSource<Transfer>();

  ngOnInit() {
    super.ngOnInit();
    this.childrenDataSource.next(this.transfer.children);
  }

  from(transfer: Transfer): string {
    return ApiHelper.accountName(this.generalMessages, true,
      transfer.from, transfer.type);
  }

  to(transfer: Transfer): string {
    return ApiHelper.accountName(this.generalMessages, false,
      transfer.to, transfer.type);
  }

  path(transfer: Transfer): string[] {
    return ['/banking', 'transfer', ApiHelper.transactionNumberOrId(transfer)];
  }

  get displayedColumns(): string[] {
    if (this.layout.xs) {
      return ['aggregated', 'amount'];
    } else if (this.transfer.currency.transactionNumberPattern) {
      return ['date', 'transactionNumber', 'from', 'to', 'amount'];
    } else {
      return ['date', 'from', 'to', 'amount'];
    }
  }
}
