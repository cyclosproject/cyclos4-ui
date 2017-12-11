import { Component, ChangeDetectionStrategy, Injector, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { BaseUsersComponent } from 'app/users/base-users.component';
import { GroupForRegistration } from 'app/api/models/group-for-registration';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ApiHelper } from 'app/shared/api-helper';

@Component({
  selector: 'registration-group',
  templateUrl: './registration-group.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistrationGroupComponent extends BaseUsersComponent {

  constructor(injector: Injector) {
    super(injector);
  }

  @Input()
  groups: GroupForRegistration[];

  @Input()
  form: FormGroup;
}
