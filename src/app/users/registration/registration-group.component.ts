import { Component, ChangeDetectionStrategy, Injector, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BaseUsersComponent } from 'app/users/base-users.component';
import { GroupForRegistration } from 'app/api/models/group-for-registration';

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
