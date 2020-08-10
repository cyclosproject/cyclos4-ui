import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { AvailabilityEnum, CustomField, OperatorDataForNew, UserRegistrationResult, UserRegistrationStatusEnum } from 'app/api/models';
import { OperatorsService } from 'app/api/services';
import { UserHelperService } from 'app/core/user-helper.service';
import { BasePageComponent } from 'app/shared/base-page.component';
import { cloneControl, validateBeforeSubmit } from 'app/shared/helper';
import { Menu } from 'app/shared/menu';
import { BehaviorSubject } from 'rxjs';

/**
 * Operator registration. Works by owner, admin and broker
 */
@Component({
  selector: 'operator-registration',
  templateUrl: 'operator-registration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperatorRegistrationComponent
  extends BasePageComponent<OperatorDataForNew>
  implements OnInit {

  user: string;
  self: boolean;
  form: FormGroup;
  mobileForm: FormGroup;
  landLineForm: FormGroup;
  passwordForms: FormGroup[];
  editableFields: Set<string>;
  result$ = new BehaviorSubject<UserRegistrationResult>(null);

  constructor(
    injector: Injector,
    private userHelper: UserHelperService,
    private operatorsService: OperatorsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.user = this.route.snapshot.params.user || this.ApiHelper.SELF;
    this.self = this.authHelper.isSelf(this.user);

    this.addSub(this.operatorsService.getOperatorDataForNew({ user: this.user }).subscribe(data =>
      this.data = data));
  }

  onDataInitialized(data: OperatorDataForNew) {
    // Setup the forms
    this.form = this.formBuilder.group({
      group: null,
    });
    [this.mobileForm, this.landLineForm] = this.userHelper.setupRegistrationForm(this.form, data, false);
    this.passwordForms = this.userHelper.passwordRegistrationForms(data);
    this.editableFields = this.userHelper.fieldNamesByAction(data, 'edit');
  }

  canEdit(field: string | CustomField): boolean {
    return this.editableFields.has(this.fieldHelper.fieldName(field));
  }

  get mobileAvailability(): AvailabilityEnum {
    return this.data.phoneConfiguration.mobileAvailability;
  }

  get landLineAvailability(): AvailabilityEnum {
    return this.data.phoneConfiguration.landLineAvailability;
  }

  register() {
    // Build a full form, so it can all be validated once
    const fullForm = cloneControl(this.form);
    if (this.mobileForm) {
      fullForm.setControl('mobile', this.mobileForm);
    }
    if (this.landLineForm) {
      fullForm.setControl('landLine', this.landLineForm);
    }
    fullForm.setControl('passwords', new FormArray(this.passwordForms));
    if (!validateBeforeSubmit(fullForm)) {
      return;
    }
    // Register the operator
    this.addSub(this.operatorsService.registerOperator({
      user: this.user, body: fullForm.value,
    }).subscribe(result => this.result$.next(result)));
  }

  get doneMessageHtml(): string {
    const result = this.result$.value;
    if (!result) {
      return null;
    }
    const operator = result.user.display;
    switch (result.status) {
      case UserRegistrationStatusEnum.ACTIVE:
        return this.i18n.user.operatorRegistrationActive(operator);
      case UserRegistrationStatusEnum.INACTIVE:
        return this.i18n.user.operatorRegistrationInactive(operator);
      case UserRegistrationStatusEnum.EMAIL_VALIDATION:
        return this.i18n.user.operatorRegistrationPending(operator);
    }
  }

  viewProfile() {
    const result = this.result$.value;
    if (result) {
      this.router.navigate(['users', result.user.id, 'profile']);
    }
  }

  resolveMenu(data: OperatorDataForNew) {
    return this.authHelper.userMenu(data.user, Menu.MY_OPERATORS);
  }

}
