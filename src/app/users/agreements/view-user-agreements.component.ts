import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Agreement, UserAgreementsData } from 'app/api/models';
import { AgreementsService } from 'app/api/services';
import { HeadingAction } from 'app/shared/action';
import { BaseViewPageComponent } from 'app/shared/base-view-page.component';
import { validateBeforeSubmit } from 'app/shared/helper';
import { Menu } from 'app/shared/menu';

/**
 * Displays the currently accepted user agreements and allows users to change the optional agreements
 */
@Component({
  selector: 'view-user-agreements',
  templateUrl: 'view-user-agreements.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewUserAgreementsComponent extends BaseViewPageComponent<UserAgreementsData> implements OnInit {
  constructor(
    injector: Injector,
    private agreementsService: AgreementsService) {
    super(injector);
  }

  param: string;
  self: boolean;
  optionalControl: FormControl;
  noAgreements: boolean
  allOptional: Agreement[];
  acceptedOptional: Agreement[];
  acceptedRequired: Agreement[];

  ngOnInit() {
    super.ngOnInit();
    this.param = this.route.snapshot.params.user;
    this.addSub(this.agreementsService.getUserAgreements({
      user: this.param,
      fields: ['-history']
    }).subscribe(data => {
      this.data = data;
    }));
  }

  onDataInitialized(data: UserAgreementsData) {
    this.self = this.authHelper.isSelf(data.user);
    const acceptedIds = Object.keys(data.accepted || {});
    const accepted = (data.agreements || []).filter(a => acceptedIds.includes(a.id));
    this.allOptional = (data.agreements || []).filter(a => !a.required);
    this.acceptedOptional = accepted.filter(a => !a.required);
    this.acceptedRequired = accepted.filter(a => a.required);
    if (data.canEdit) {
      this.optionalControl = this.formBuilder.control(this.acceptedOptional.map(a => a.id));
    } else {
      this.noAgreements = accepted.length === 0;
    }
    if (!this.noAgreements) {
      this.headingActions = [
        new HeadingAction('history', this.i18n.general.viewHistory, () =>
          this.router.navigate(['users', this.param, 'agreements', 'history']), true),
      ];
    }
  }

  save() {
    if (!validateBeforeSubmit(this.optionalControl)) {
      return;
    }
    this.addSub(this.agreementsService.acceptOptionalAgreements({
      agreements: this.optionalControl.value
    }).subscribe(() => {
      this.notification.snackBar(this.i18n.agreements.optionalSaved);
      this.reload();
    }));
  }

  resolveMenu(data: UserAgreementsData) {
    return this.authHelper.userMenu(data.user, Menu.AGREEMENTS);
  }
}
