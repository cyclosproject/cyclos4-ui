import { Component, Injector, ChangeDetectionStrategy, Input } from '@angular/core';
import { BaseUsersComponent } from 'app/users/base-users.component';
import { UserDataForNew } from 'app/api/models';
import { FormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

/**
 * Provides the input for user fields
 */
@Component({
  selector: 'registration-fields',
  templateUrl: 'registration-fields.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistrationFieldsComponent extends BaseUsersComponent {
  constructor(injector: Injector) {
    super(injector);
  }

  @Input()
  form: FormGroup;

  @Input()
  data: UserDataForNew;

  ngOnInit() {
    super.ngOnInit();
    this.subscriptions.push(this.form.statusChanges.subscribe(st => {
      console.dir(st);
      this.detectChanges();
    }));
  }

  get hasName(): boolean {
    return this.canEdit('name');
  }

  get hasUsername(): boolean {
    return this.canEdit('name') && !this.data.generatedUsername;
  }

  get hasEmail(): boolean {
    return this.canEdit('email');
  }

  get canHideEmail(): boolean {
    const actions = this.data.profileFieldActions['email'];
    return actions && actions.managePrivacy;
  }

  private canEdit(field: string): boolean {
    const actions = this.data.profileFieldActions[field];
    return actions && actions.edit;
  }

}
