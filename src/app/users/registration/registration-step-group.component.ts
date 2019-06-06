import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { GroupForRegistration, Group } from 'app/api/models';
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
  @Input() groupSets: Group[];
  @Input() groups: (GroupForRegistration | Group)[];
  @Input() control: FormControl;

  constructor(injector: Injector) {
    super(injector);
  }

  groupsForSet(groupSet: Group) {
    const groups = this.groups as Group[];
    if (groupSet == null) {
      return groups.filter(g => g.groupSet == null);
    } else {
      return groups.filter(g => g.groupSet === groupSet.id);
    }
  }
}
