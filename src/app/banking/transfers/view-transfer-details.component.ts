import { Component, Injector, ChangeDetectionStrategy, Input } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { TransferView } from 'app/api/models/transfer-view';
import { ApiHelper } from 'app/shared/api-helper';
import { Transfer } from 'app/api/models';
import { TableDataSource } from 'app/shared/table-datasource';

const FROM = '_FROM_';
const TO = '_TO_';

/**
 * Component that shows details of a transfer
 */
@Component({
  selector: 'view-transfer-details',
  templateUrl: './view-transfer-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewTransferDetailsComponent extends BaseComponent {
  constructor(
    injector: Injector
  ) {
    super(injector);
  }

  @Input()
  transfer: TransferView;

  childrenDataSource = new TableDataSource<Transfer>();

  fromToTemplate: { fromFirst: boolean, prefix: string, separator: string, suffix: string };

  ngOnInit() {
    super.ngOnInit();
    this.childrenDataSource.next(this.transfer.children);

    const msg = this.messages.transactionFromTo(FROM, TO);
    const fromIx = msg.indexOf(FROM);
    const toIx = msg.indexOf(TO);
    const fromFirst = fromIx < toIx;
    const firstBegin = fromFirst ? fromIx : toIx;
    const firstEnd = fromFirst ? fromIx + FROM.length : toIx + TO.length;
    const secondBegin = fromFirst ? toIx : fromIx;
    const secondEnd = fromFirst ? toIx + TO.length : fromIx + FROM.length;
    this.fromToTemplate = {
      fromFirst: fromFirst,
      prefix: msg.substring(0, firstBegin),
      separator: msg.substring(firstEnd, secondBegin),
      suffix: msg.substring(secondEnd)
    };
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
