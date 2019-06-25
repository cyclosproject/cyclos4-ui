import {
  ChangeDetectionStrategy, Component, ElementRef, Host, Injector,
  Input, OnDestroy, OnInit, Optional, SkipSelf, ViewChild
} from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { User, UserQueryFilters } from 'app/api/models';
import { UsersService } from 'app/api/services';
import { Configuration } from 'app/configuration';
import { LoginService } from 'app/core/login.service';
import { NextRequestState } from 'app/core/next-request-state';
import { UserCacheService } from 'app/core/user-cache.service';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseAutocompleteFieldComponent } from 'app/shared/base-autocomplete-field.component';
import { focus } from 'app/shared/helper';
import { PickContactComponent } from 'app/shared/pick-contact.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Observable, of, Subscription } from 'rxjs';
import { distinctUntilChanged, first } from 'rxjs/operators';

/**
 * Field used to select a user
 */
@Component({
  selector: 'user-field',
  templateUrl: 'user-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: UserFieldComponent, multi: true }
  ]
})
export class UserFieldComponent
  extends BaseAutocompleteFieldComponent<string, User>
  implements OnInit, OnDestroy {

  @Input() get user(): User {
    return this.selection;
  }
  set user(user: User) {
    this.selection = user;
  }

  @Input() allowPrincipal = false;
  @Input() allowSearch = true;
  @Input() allowContacts = true;
  @Input() filters: UserQueryFilters;

  @ViewChild('contactListButton', { static: false }) contactListButton: ElementRef;
  private fieldSub: Subscription;

  placeholder: string;

  constructor(
    injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    private userCache: UserCacheService,
    private usersService: UsersService,
    private login: LoginService,
    private nextRequestState: NextRequestState,
    private modal: BsModalService) {
    super(injector, controlContainer);
  }

  ngOnInit() {
    super.ngOnInit();
    this.fieldSub = this.inputFieldControl.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe(value => {
        if (this.allowPrincipal) {
          this.value = ApiHelper.escapeNumeric(value);
        }
      });
    if (this.allowSearch) {
      this.placeholder = this.i18n.field.user.placeholderAllowSearch;
    } else if (this.allowPrincipal) {
      this.placeholder = this.i18n.field.user.placeholderPrincipal;
    }

    const permissions = this.login.auth.permissions || {};

    // When the user has no permissions for search, disable the option
    const users = permissions.users || {};
    if (!users.search) {
      this.allowSearch = false;
    }

    // When the user has no permissions for contacts, disable the option
    const contacts = permissions.contacts || {};
    if (!contacts.enable) {
      this.allowContacts = false;
    }

    if (!this.allowSearch) {
      this.allowOptions = false;
    }
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this.fieldSub.unsubscribe();
  }

  onDisabledChange(isDisabled: boolean): void {
    super.onDisabledChange(isDisabled);
    if (this.contactListButton && this.contactListButton.nativeElement) {
      this.contactListButton.nativeElement.disabled = isDisabled;
    }
  }

  protected fetch(value: string): Observable<User> {
    return this.userCache.get(value);
  }

  protected query(text: string): Observable<User[]> {
    if (!this.allowSearch) {
      return of([]);
    }
    const loggedUser = this.login.user;
    const filters: UserQueryFilters = this.filters ? { ...this.filters } : {};
    filters.ignoreProfileFieldsInList = true,
      filters.pageSize = Configuration.quickSearchPageSize;
    filters.keywords = text;
    if (loggedUser) {
      filters.usersToExclude = [...(filters.usersToExclude || []), ApiHelper.SELF];
    }
    this.nextRequestState.leaveNotification = true;
    return this.usersService.searchUsers(filters);
  }

  toDisplay(user: User): string {
    return user.display;
  }

  toValue(user: User): string {
    return `id:${user.id}`;
  }

  showContactList() {
    const ref = this.modal.show(PickContactComponent, {
      class: 'modal-form',
      initialState: {
        exclude: (this.filters || {}).usersToExclude || []
      }
    });
    const component = ref.content as PickContactComponent;
    component.select.pipe(first()).subscribe(u => this.select(u));
    this.modal.onHide.pipe(first()).subscribe(() => focus(this.inputField, true));
  }

  onInputFocus() {
    this.allowOptions = this.allowSearch;
  }

  onInputBlur() {
    this.allowOptions = false;
  }

  onEscapePressed() {
    // When a principal is allowed, pressing esc will just close the popup, and leave the value there
    if (this.allowPrincipal) {
      this.close();
    } else {
      this.select(null);
    }
  }

}
