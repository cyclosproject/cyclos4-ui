import { AfterViewChecked, ChangeDetectionStrategy, Component, ElementRef, Injector, OnInit, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Agreement } from 'app/api/models';
import { AgreementsService } from 'app/api/services';
import { LoginState } from 'app/core/login-state';
import { RegistrationAgreementsComponent } from 'app/login/registration-agreements.component';
import { BasePageComponent } from 'app/shared/base-page.component';
import { empty, validateBeforeSubmit } from 'app/shared/helper';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Menu } from 'app/shared/menu';

/**
 * Component shown after the user logs-in with pending agreements
 */
@Component({
  selector: 'accept-pending-agreements',
  templateUrl: 'accept-pending-agreements.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AcceptPendingAgreementsComponent
  extends BasePageComponent<Agreement[]>
  implements OnInit, AfterViewChecked {

  title: string;
  mobileTitle: string;
  message: string;

  accept = new FormControl(false, Validators.requiredTrue);
  initialized = false;
  @ViewChild('agreementsContent', { static: false }) agreementsContent: ElementRef;

  constructor(
    injector: Injector,
    private agreementsService: AgreementsService,
    private loginState: LoginState,
    private modal: BsModalService
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

    this.addSub(this.agreementsService.listPendingAgreements().subscribe(data => {
      if (empty(data)) {
        this.router.navigateByUrl(this.loginState.redirectUrl || '');
        return;
      }
      this.data = data;
    }));
  }

  ngAfterViewChecked() {
    if (!this.initialized && this.agreementsContent) {
      const el: HTMLElement = this.agreementsContent.nativeElement;
      el.innerHTML = this.i18n.pendingAgreements.agree(
        `<a href="#" onclick="event.preventDefault();event.stopPropagation();showAgreements()">
        ${this.agreements.map(a => a.name).join(', ')}
        </a>`
      );
      window['showAgreements'] = () => {
        this.modal.show(RegistrationAgreementsComponent, {
          class: 'modal-form',
          initialState: {
            agreements: this.agreements
          }
        });
      };
      this.initialized = true;
    }
  }

  submit() {
    if (!validateBeforeSubmit(this.accept)) {
      return;
    }
    const ids = this.agreements.map(a => a.id);
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
