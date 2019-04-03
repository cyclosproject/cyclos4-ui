import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { TransferView } from 'app/api/models';
import { TransfersService } from 'app/api/services';
import { BankingHelperService } from 'app/core/banking-helper.service';
import { HeadingAction } from 'app/shared/action';
import { BasePageComponent } from 'app/shared/base-page.component';
import { empty } from 'app/shared/helper';
import { OperationHelperService } from 'app/core/operation-helper.service';


/**
 * Displays a transfer details
 */
@Component({
  selector: 'view-transfer',
  templateUrl: 'view-transfer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewTransferComponent extends BasePageComponent<TransferView> implements OnInit {

  actions: HeadingAction[];

  constructor(
    injector: Injector,
    private bankingHelper: BankingHelperService,
    private transfersService: TransfersService,
    private operationHelper: OperationHelperService) {
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
        this.headingActions = this.initActions(transfer);
        this.data = transfer;
      });
  }


  private initActions(transfer: TransferView): HeadingAction[] {
    const actions: HeadingAction[] = [this.printAction];
    const transaction = transfer.transaction || {};
    if (!empty(transaction.authorizations)) {
      actions.push(new HeadingAction('check_circle_outline', this.messages.transaction.viewAuthorizations, () => {
        this.router.navigate(['banking', 'transaction', this.bankingHelper.transactionNumberOrId(transaction), 'authorization-history']);
      }));
    }
    if (transfer.canChargeback) {
      actions.push(new HeadingAction('undo', this.messages.transaction.chargebackTransfer, () => {
        this.chargeback();
      }));
    }
    for (const operation of transfer.operations || []) {
      actions.push(this.operationHelper.headingAction(operation, transfer.id));
    }
    return actions;
  }

  private chargeback() {
    this.notification.confirm({
      title: this.messages.transaction.chargebackTransfer,
      message: this.messages.transaction.chargebackTransferMessage,
      passwordInput: this.transfer.confirmationPasswordInput,
      callback: res => {
        this.transfersService.chargebackTransfer({
          key: this.transfer.id,
          confirmationPassword: res.confirmationPassword
        }).subscribe(() => {
          this.notification.snackBar(this.messages.transaction.chargebackTransferDone);
          this.reload();
        });
      }
    });
  }
}
