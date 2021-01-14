import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Group, GroupForRegistration } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { LoginService } from 'app/ui/core/login.service';

/**
 * Public registration step: select the group
 */
@Component({
  selector: 'registration-step-group',
  templateUrl: 'registration-step-group.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationStepGroupComponent extends BaseComponent implements OnInit {
  @Input() groupSets: Group[];
  @Input() groups: (GroupForRegistration | Group)[];
  @Input() control: FormControl;
  singleLine: boolean;

  constructor(
    injector: Injector,
    public login: LoginService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    // Show in a single line if there's at most 3 groups, and none has description
    this.singleLine = this.groups.length <= 3 && this.groups.filter(g => g['description']).length === 0;
  }

  groupsForSet(groupSet: Group) {
    const groups = this.groups as Group[];
    if (groupSet == null) {
      return groups.filter(g => g.groupSet == null);
    } else {
      return groups.filter(g => [groupSet.id, groupSet.internalName].includes(g.groupSet));
    }
  }
}
