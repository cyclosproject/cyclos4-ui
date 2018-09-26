import { Component, ChangeDetectionStrategy, Injector, OnInit } from '@angular/core';

import { TransfersService } from 'app/api/services';
import { TransferView } from 'app/api/models';
import { BasePageComponent } from 'app/shared/base-page.component';
import { Action } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';

/**
 * Displays a transfer details
 */
@Component({
  selector: 'view-transfer',
  templateUrl: 'view-transfer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewTransferComponent extends BasePageComponent<TransferView> implements OnInit {

  actions: Action[];

  constructor(
    injector: Injector,
    private transfersService: TransfersService) {
    super(injector);
  }

  get transfer(): TransferView {
    return this.data;
  }

  ngOnInit() {
    super.ngOnInit();
    const key = this.route.snapshot.paramMap.get('key');
    this.transfersService.viewTransfer({ key: key })
      .subscribe(transfer => {
        this.actions = this.initActions(transfer);
        this.data = transfer;
      });
  }


  private initActions(transfer: TransferView): Action[] {
    const actions: Action[] = [];
    if (transfer.canChargeback) {
      actions.push(new Action('undo', this.i18n('Chargeback'), () => {
        this.chargeback();
      }));
    }
    if (transfer.chargedBackBy) {
      actions.push(new Action('view', this.i18n('View chargeback'), () => {
        this.router.navigate(['/banking', 'transfer', ApiHelper.transactionNumberOrId(transfer.chargedBackBy)]);
      }));
    }
    return actions;
  }

  private chargeback() {
    this.notification.confirm({
      title: this.i18n('Chargeback payment'),
      passwordInput: this.transfer.confirmationPasswordInput,
      callback: res => {
        this.transfersService.chargebackTransfer({
          key: this.transfer.id,
          confirmationPassword: res.confirmationPassword
        }).subscribe(() => {
          this.notification.snackBar(this.i18n('This transfer was charged back'));
          this.reload();
        });
      }
    });
  }
}
