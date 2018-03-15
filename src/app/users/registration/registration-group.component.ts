import { Component, ChangeDetectionStrategy, Injector, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BaseComponent } from 'app/shared/base.component';
import { GroupForRegistration } from 'app/api/models/group-for-registration';

@Component({
  selector: 'registration-group',
  templateUrl: './registration-group.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistrationGroupComponent extends BaseComponent {

  constructor(injector: Injector) {
    super(injector);
  }

  @Input()
  groups: GroupForRegistration[];

  @Input()
  form: FormGroup;
}
