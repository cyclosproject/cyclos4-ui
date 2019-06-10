import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  OperatorGroupAccountAccessEnum, OperatorGroupAccountView, OperatorGroupView,
  OperatorGroupPaymentView, TransferTypeWithCurrency
} from 'app/api/models';
import { OperatorGroupsService } from 'app/api/services';
import { UserHelperService } from 'app/core/user-helper.service';
import { HeadingAction } from 'app/shared/action';
import { BaseViewPageComponent } from 'app/shared/base-view-page.component';

/**
 * Operator group view
 */
@Component({
  selector: 'view-operator-group',
  templateUrl: 'view-operator-group.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewOperatorGroupComponent
  extends BaseViewPageComponent<OperatorGroupView>
  implements OnInit {

  id: string;
  self: boolean;
  singleAccount: boolean;
  visibleAccounts: OperatorGroupAccountView[];
  paymentsByAccount: { [key: string]: OperatorGroupPaymentView[] };
  authorizeByAccount: { [key: string]: TransferTypeWithCurrency[] };

  constructor(
    injector: Injector,
    public userHelper: UserHelperService,
    private operatorGroupsService: OperatorGroupsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.id = this.route.snapshot.paramMap.get('id');
    this.addSub(this.operatorGroupsService.viewOperatorGroup({ id: this.id }).subscribe(data => {
      this.data = data;
    }));
  }

  get group(): OperatorGroupView {
    return this.data;
  }

  onDataInitialized(group: OperatorGroupView) {
    this.self = this.authHelper.isSelf(group.user);
    const accounts = (group.accounts || []);
    this.visibleAccounts = accounts.filter(a => a.access !== OperatorGroupAccountAccessEnum.NONE);
    this.singleAccount = accounts.length === 1;
    this.paymentsByAccount = {};
    this.authorizeByAccount = {};
    const payments = group.payments || [];
    for (const a of this.visibleAccounts) {
      this.paymentsByAccount[a.accountType.id] = payments
        .filter(p => p.perform && p.paymentType.from.id === a.accountType.id);
      this.authorizeByAccount[a.accountType.id] = payments
        .filter(p => p.authorize && p.paymentType.from.id === a.accountType.id)
        .map(p => p.paymentType);
    }
    if (group.editable) {
      this.headingActions = [
        new HeadingAction('clear', this.i18n.general.remove, () => this.remove())
      ];
    }
  }

  remove() {
    this.notification.confirm({
      message: this.i18n.general.removeConfirm(this.group.name),
      callback: () => this.doRemove()
    });
  }

  private doRemove() {
    this.addSub(this.operatorGroupsService.deleteOperatorGroup({ id: this.id }).subscribe(() => {
      this.notification.snackBar(this.i18n.general.removeDone(this.group.name));
      this.router.navigate(['users', this.authHelper.orSelf(this.group.user), 'operator-groups']);
    }));
  }
}
