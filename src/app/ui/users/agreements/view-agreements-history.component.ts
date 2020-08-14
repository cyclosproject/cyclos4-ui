import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AgreementLog, UserAgreementsData } from 'app/api/models';
import { AgreementsService } from 'app/api/services';
import { UserHelperService } from 'app/ui/core/user-helper.service';
import { AgreementsContentDialogComponent } from 'app/ui/shared/agreement-content-dialog.component';
import { BaseViewPageComponent } from 'app/ui/shared/base-view-page.component';
import { Menu } from 'app/ui/shared/menu';
import { BsModalService } from 'ngx-bootstrap/modal';

/**
 * Displays the user agreements history
 */
@Component({
  selector: 'view-agreements-history',
  templateUrl: 'view-agreements-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewAgreementsHistoryComponent extends BaseViewPageComponent<UserAgreementsData> implements OnInit {
  constructor(
    injector: Injector,
    private agreementsService: AgreementsService,
    private userHelper: UserHelperService,
    private modal: BsModalService) {
    super(injector);
  }

  self: boolean;
  param: string;
  hasAccepted: boolean;
  hasRemoteAddress: boolean;

  ngOnInit() {
    super.ngOnInit();
    this.param = this.route.snapshot.params.user;
    this.addSub(this.agreementsService.getUserAgreements({
      user: this.param,
      fields: ['user', 'history']
    }).subscribe(data => {
      this.data = data;
    }));
  }

  onDataInitialized(data: UserAgreementsData) {
    this.self = this.authHelper.isSelf(data.user);
    const history = data.history || [];
    // Show the accepted column when any of the logs is not accepted
    this.hasAccepted = history.findIndex(l => !l.accepted) >= 0;
    this.hasRemoteAddress = history.findIndex(l => l.remoteAddress) >= 0;
  }

  get operator() {
    return this.userHelper.isOperator(this.data.user);
  }

  resolveMenu(data: UserAgreementsData) {
    return this.menu.userMenu(data.user, Menu.AGREEMENTS);
  }

  get showAgreement() {
    return (log: AgreementLog) => {
      if (log.accepted) {
        this.modal.show(AgreementsContentDialogComponent, {
          ignoreBackdropClick: true,
          class: 'modal-form modal-form-large',
          initialState: {
            agreement: log.agreement,
            version: log.acceptedVersion
          },
        });
      }
    };
  }
}
