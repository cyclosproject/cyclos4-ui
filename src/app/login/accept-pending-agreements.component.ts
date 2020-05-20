import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Agreement } from 'app/api/models';
import { AgreementsService } from 'app/api/services';
import { LoginState } from 'app/core/login-state';
import { BasePageComponent } from 'app/shared/base-page.component';
import { empty, validateBeforeSubmit } from 'app/shared/helper';
import { Menu } from 'app/shared/menu';

/**
 * Component shown after the user logs-in with pending agreements
 */
@Component({
  selector: 'accept-pending-agreements',
  templateUrl: 'accept-pending-agreements.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcceptPendingAgreementsComponent
  extends BasePageComponent<Agreement[]>
  implements OnInit {

  title: string;
  mobileTitle: string;
  message: string;

  accepted = new FormControl([]);

  constructor(
    injector: Injector,
    private agreementsService: AgreementsService,
    private loginState: LoginState
  ) {
    super(injector);
  }

  get agreements(): Agreement[] {
    return this.data;
  }

  ngOnInit() {
    super.ngOnInit();
    const auth = this.dataForUiHolder.dataForUi.auth;
    if (!auth.pendingAgreements) {
      // No agreements
      this.router.navigateByUrl(this.loginState.redirectUrl || '');
      return;
    }

    if (auth.everAcceptedAgreements) {
      this.title = this.i18n.pendingAgreements.title.previouslyAccepted;
      this.mobileTitle = this.i18n.pendingAgreements.mobileTitle.previouslyAccepted;
      this.message = this.i18n.pendingAgreements.messagePreviouslyAccepted;
    } else {
      this.title = this.i18n.pendingAgreements.title.firstTime;
      this.mobileTitle = this.i18n.pendingAgreements.mobileTitle.firstTime;
      this.message = this.i18n.pendingAgreements.messageFirstTime;
    }

    this.addSub(this.agreementsService.listPendingAgreements({
      fields: ['-content']
    }).subscribe(data => {
      if (empty(data)) {
        this.router.navigateByUrl(this.loginState.redirectUrl || '');
        return;
      }
      this.data = data;
    }));
  }

  submit() {
    if (!validateBeforeSubmit(this.accepted)) {
      return;
    }
    const ids = this.accepted.value as string[];
    this.addSub(this.agreementsService.acceptPendingAgreement({ agreements: ids }).subscribe(() => this.reload()));
  }

  reload() {
    this.addSub(this.dataForUiHolder.reload().subscribe(() =>
      this.router.navigateByUrl(this.loginState.redirectUrl || '')));
  }

  cancel() {
    // Logout and return to the login page
    this.login.logout();
  }

  resolveMenu() {
    return Menu.DASHBOARD;
  }
}
