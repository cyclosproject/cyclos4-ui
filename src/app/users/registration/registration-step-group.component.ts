import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { GroupForRegistration } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';

/**
 * Public registration step: select the group
 */
@Component({
  selector: 'registration-step-group',
  templateUrl: 'registration-step-group.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistrationStepGroupComponent extends BaseComponent implements OnInit {
  @Input() groups: GroupForRegistration[];
  @Input() control: FormControl;

  constructor(injector: Injector) {
    super(injector);
  }
}
