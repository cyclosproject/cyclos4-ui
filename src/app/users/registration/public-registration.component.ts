import { Component, ChangeDetectionStrategy, Injector, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AsyncValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { BaseUsersComponent } from 'app/users/base-users.component';
import { GroupForRegistration } from 'app/api/models/group-for-registration';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ApiHelper } from 'app/shared/api-helper';
import { UsersService } from 'app/api/services/users.service';
import { UserDataForNew } from 'app/api/models';
import { LinearStepperControlComponent } from 'app/shared/linear-stepper-control.component';
import { TdStepComponent } from '@covalent/core';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators/map';
import { debounceTime } from 'rxjs/operators/debounceTime';
import { distinctUntilChanged } from 'rxjs/operators/distinctUntilChanged';
import { switchMap } from 'rxjs/operators/switchMap';
import { UserNew } from 'app/api/models/user-new';
import { AfterViewInit } from '@angular/core/src/metadata/lifecycle_hooks';
import { Subject } from 'rxjs/Subject';
import { tap } from 'rxjs/operators/tap';

@Component({
  selector: 'public-registration',
  templateUrl: './public-registration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicRegistrationComponent extends BaseUsersComponent implements AfterViewInit {
  loaded = new BehaviorSubject<boolean>(false);

  @ViewChild('stepperControl')
  stepperControl: LinearStepperControlComponent;

  // Group step
  @ViewChild('groupStep') groupStep: TdStepComponent;
  groups: GroupForRegistration[];
  group = new BehaviorSubject<GroupForRegistration>(null);
  groupForm: FormGroup;

  // Fields step
  data = new BehaviorSubject<UserDataForNew>(null);
  @ViewChild('fieldsStep') fieldsStep: TdStepComponent;
  user = new UserNew();
  fieldsForm: FormGroup;

  constructor(
    injector: Injector,
    private formBuilder: FormBuilder,
    private usersService: UsersService) {
    super(injector);

    // Form for group selection
    this.groupForm = formBuilder.group({
      group: [null, Validators.required]
    });
    this.subscriptions.push(this.groupForm.valueChanges.subscribe(value =>
      this.group.next(value.group)));

    // Form for field (fully dynamic)
    this.fieldsForm = formBuilder.group({
    });

  }

  ngOnInit() {
    super.ngOnInit();
    this.subscriptions.push(this.route.data.subscribe((data: {
      groups: GroupForRegistration[]
    }) => {
      this.groups = data.groups;
      if (this.groups.length === 0) {
        // No groups for registration!
        this.notification.error(this.usersMessages.registrationErrorNoGroups());
      } else if (this.groups.length === 1) {
        // There is a single group - select it
        const group = this.groups[0];
        this.group.next(group);
        this.groupForm.patchValue({
          group: ApiHelper.internalNameOrId(group)
        });
        // After getting the registration data for this group, will mark as loaded
        this.nextFromGroup();
      } else {
        // The application is fully loaded
        this.loaded.next(true);
      }
    }));
  }

  ngAfterViewInit() {
    if (this.groups.length > 0) {
      this.stepperControl.activate(this.groupStep);
    }
  }

  private get groupId(): string {
    return this.group.value.id;
  }

  nextFromGroup() {
    this.usersService.getUserDataForNew({group: this.groupId})
      .subscribe(data => {
        this.prepareFieldsForm(data);
      });
  }

  private prepareFieldsForm(data: UserDataForNew) {
    // Full name
    const nameActions = data.profileFieldActions.name;
    if (nameActions && nameActions.edit) {
      this.fieldsForm.setControl('name',
        this.formBuilder.control(null, Validators.required, this.serverSideValidator('name'))
      );
    }
    // Login name
    const usernameActions = data.profileFieldActions.username;
    if (usernameActions && usernameActions.edit && !data.generatedUsername) {
      this.fieldsForm.setControl('username',
        this.formBuilder.control(null, Validators.required, this.serverSideValidator('username'))
      );
    }
    // E-mail
    const emailActions = data.profileFieldActions.username;
    if (emailActions && emailActions.edit) {
      const val = [];
      if (data.emailRequired) {
        val.push(Validators.required);
      }
      val.push(Validators.email);
      this.fieldsForm.setControl('email',
        this.formBuilder.control(null, val, this.serverSideValidator('email'))
      );
    }
    this.fieldsForm.setControl('customValues',
      ApiHelper.customValuesFormGroup(this.formBuilder, data.customFields,
        cf => this.serverSideValidator(cf.internalName)));

    this.data.next(data);

    if (!this.loaded.value) {
      // If there is a single group, just now we will finish loading
      this.loaded.next(true);
    }

    this.stepperControl.activate(this.fieldsStep);
  }

  previousFromFields() {
    this.stepperControl.activate(this.groupStep);
  }

  nextFromFields() {
    alert('Not yet');
  }

  private serverSideValidator(field: string): AsyncValidatorFn {
    return (c: AbstractControl): Observable<ValidationErrors | null> => {
      let val = c.value;
      if (val == null || val === null || !c.dirty) {
        // Don't validate empty value (will fail validation required), nor fields that haven't been modified yet
        return Observable.of(null);
      }

      // Multi selections hold the value as array, but we must pass it as pipe-separated
      if (val instanceof Array) {
        val = val.join('|');
      }

      return Observable.timer(ApiHelper.DEBOUNCE_TIME).pipe(
        switchMap(() => {
          return this.usersService.validateUserRegistrationField({
            group: this.groupId, field: field, value: val
          });
        }),
        map(msg => {
          return msg ? {message: msg} : null;
        })
      );
    };
  }

}
