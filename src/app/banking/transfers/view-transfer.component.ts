import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { CreateDeviceConfirmation, DeviceConfirmationTypeEnum, TransferView } from 'app/api/models';
import { TransfersService } from 'app/api/services';
import { BankingHelperService } from 'app/core/banking-helper.service';
import { OperationHelperService } from 'app/core/operation-helper.service';
import { HeadingAction } from 'app/shared/action';
import { BaseViewPageComponent } from 'app/shared/base-view-page.component';
import { empty } from 'app/shared/helper';


/**
 * Displays a transfer details
 */
@Component({
  selector: 'view-transfer',
  templateUrl: 'view-transfer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewTransferComponent extends BaseViewPageComponent<TransferView> implements OnInit {

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
    this.addSub(this.transfersService.viewTransfer({ key: key })
      .subscribe(transfer => {
        this.headingActions = this.initActions(transfer);
        this.data = transfer;
      }));
  }


  private initActions(transfer: TransferView): HeadingAction[] {
    const actions: HeadingAction[] = [this.printAction];
    const transaction = transfer.transaction || {};
    if (!empty(transaction.authorizations)) {
      actions.push(new HeadingAction('check_circle_outline', this.i18n.transaction.viewAuthorizations, () => {
        this.router.navigate(['banking', 'transaction', this.bankingHelper.transactionNumberOrId(transaction), 'authorization-history']);
      }));
    }
    if (transfer.canChargeback) {
      actions.push(new HeadingAction('undo', this.i18n.transaction.chargebackTransfer, () => {
        this.chargeback();
      }));
    }
    for (const operation of transfer.operations || []) {
      actions.push(this.operationHelper.headingAction(operation, transfer.id));
    }
    return actions;
  }


  private chargebackDeviceConfirmation(): () => CreateDeviceConfirmation {
    return () => ({
      type: DeviceConfirmationTypeEnum.CHARGEBACK,
      transfer: this.transfer.id
    });
  }

  private chargeback() {
    this.notification.confirm({
      title: this.i18n.transaction.chargebackTransfer,
      message: this.i18n.transaction.chargebackTransferMessage,
      createDeviceConfirmation: this.chargebackDeviceConfirmation(),
      passwordInput: this.transfer.confirmationPasswordInput,
      callback: res => {
        this.addSub(this.transfersService.chargebackTransfer({
          key: this.transfer.id,
          confirmationPassword: res.confirmationPassword
        }).subscribe(() => {
          this.notification.snackBar(this.i18n.transaction.chargebackTransferDone);
          this.reload();
        }));
      }
    });
  }
}
