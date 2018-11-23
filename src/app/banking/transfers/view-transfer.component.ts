import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { TransferView } from 'app/api/models';
import { TransfersService } from 'app/api/services';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { BasePageComponent } from 'app/shared/base-page.component';
import { empty } from 'app/shared/helper';


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
        this.headingActions = this.initActions(transfer);
        this.data = transfer;
      });
  }


  private initActions(transfer: TransferView): HeadingAction[] {
    const actions: HeadingAction[] = [this.printAction];
    const transaction = transfer.transaction || {};
    if (!empty(transaction.authorizations)) {
      actions.push(new HeadingAction('check_circle_outline', this.i18n('View authorizations'), () => {
        this.router.navigate(['banking', 'transaction', ApiHelper.transactionNumberOrId(transaction), 'authorization-history']);
      }));
    }
    if (transfer.canChargeback) {
      actions.push(new HeadingAction('undo', this.i18n('Chargeback transfer'), () => {
        this.chargeback();
      }));
    }
    if (transfer.chargedBackBy) {
      actions.push(new HeadingAction('view', this.i18n('View chargeback'), () => {
        this.router.navigate(['/banking', 'transfer', ApiHelper.transactionNumberOrId(transfer.chargedBackBy)]);
      }));
    }
    return actions;
  }

  private chargeback() {
    this.notification.confirm({
      title: this.i18n('Chargeback transfer'),
      message: this.i18n('This return the amount to the payer'),
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
