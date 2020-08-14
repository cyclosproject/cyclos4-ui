import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { GroupForRegistration } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';

/**
 * Step in a custom wizard - group selection
 */
@Component({
  selector: 'run-wizard-step-group',
  templateUrl: 'run-wizard-step-group.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RunWizardStepGroupComponent
  extends BaseComponent
  implements OnInit {

  @Input() groups: GroupForRegistration[];
  @Input() control: FormControl;

  singleLine: boolean;

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.singleLine = this.groups.length <= 3 && this.groups.filter(g => g.description).length === 0;
  }
}
