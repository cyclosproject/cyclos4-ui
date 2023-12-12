import { ChangeDetectionStrategy, Component, Host, Injector, Input, OnInit, Optional, SkipSelf, ViewChild } from '@angular/core';
import { ControlContainer, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { PrincipalType, User } from 'app/api/models';
import { UserCacheService } from 'app/core/user-cache.service';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import { UserFieldComponent } from 'app/shared/user-field.component';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Field used to select multiple users. The value is an array with all users.
 */
@Component({
  selector: 'multiple-users-field',
  templateUrl: 'multiple-users-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: MultipleUsersFieldComponent, multi: true },
  ],
})
export class MultipleUsersFieldComponent
  extends BaseFormFieldComponent<string[]> implements OnInit {

  users$ = new BehaviorSubject<User[]>([]);
  get users(): User[] {
    return this.users$.value;
  }
  set users(users: User[]) {
    this.users$.next(users);
  }

  @Input() preselectedUsers: User[];
  @Input() allowPrincipal = false;
  @Input() principalTypes: PrincipalType[];
  @Input() allowSearch = true;
  @Input() allowContacts = true;

  @ViewChild('userField') userField: UserFieldComponent;

  userFieldControl = new FormControl(null);

  constructor(
    injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    private userCache: UserCacheService) {
    super(injector, controlContainer);
  }

  ngOnInit() {
    super.ngOnInit();
    this.userCache.register(this.preselectedUsers);
    if (this.preselectedUsers) {
      this.users = [...this.preselectedUsers];
    }
  }

  onDisabledChange(isDisabled: boolean): void {
    super.onDisabledChange(isDisabled);
  }

  add(user: User) {
    if (!user) {
      return;
    }
    if (!this.users.find(u => u.id === user.id)) {
      this.users = [...this.users, user];
      this.updateValue();
    }
    this.userFieldControl.setValue(null);
    setTimeout(() => {
      this.userField.select(null, null, { emitEvent: false });
    }, 1);
  }

  remove(user: User) {
    if (user && this.users.find(u => u.id === user.id)) {
      this.users = this.users.filter(u => u.id !== user.id);
      this.updateValue();
    }
  }

  preprocessValue(value: string[]): any {
    if (value && value.length > 0) {
      return forkJoin((value || []).map(u => this.userCache.get(u)))
        .pipe(map(users => users.map(u => this.toValue(u))));
    } else {
      return null;
    }
  }

  toValue(user: User): string {
    return `id:${user.id}`;
  }

  protected getFocusableControl() {
    throw this.userField;
  }

  protected getDisabledValue(): string {
    return (this.users || []).map(u => u.display).join(', ');
  }

  private updateValue() {
    this.value = this.users.map(u => this.toValue(u));
  }
}
