import { Component, Injector, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { TransfersService } from 'app/api/services/transfers.service';
import { BaseBankingComponent } from 'app/banking/base-banking.component';
import { TransferView } from 'app/api/models/transfer-view';

/**
 * Component that shows details of a transfer
 */
@Component({
  selector: 'view-transfer',
  templateUrl: './view-transfer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewTransferComponent extends BaseBankingComponent {
  constructor(
    injector: Injector,
    private transfersService: TransfersService
  ) {
    super(injector);
  }

  loaded = new BehaviorSubject<boolean>(false);

  transfer: TransferView;

  ngOnInit() {
    const key = this.route.snapshot.paramMap.get('key');
    this.transfersService.viewTransfer({key: key})
      .subscribe(transfer => {
        this.transfer = transfer;
        this.loaded.next(true);
      });
  }
}
