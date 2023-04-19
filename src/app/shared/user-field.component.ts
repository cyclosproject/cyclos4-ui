import {
  ChangeDetectionStrategy, Component, ElementRef, Host, Injector,
  Input, OnDestroy, OnInit, Optional, SkipSelf, ViewChild
} from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { PrincipalType, User, UserQueryFilters } from 'app/api/models';
import { UsersService } from 'app/api/services/users.service';
import { ErrorHandlerService } from 'app/core/error-handler.service';
import { NextRequestState } from 'app/core/next-request-state';
import { UserCacheService } from 'app/core/user-cache.service';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseAutocompleteFieldComponent } from 'app/shared/base-autocomplete-field.component';
import { empty, focus } from 'app/shared/helper';
import { PickContactComponent } from 'app/shared/pick-contact.component';
import { ScanQrCodeComponent } from 'app/shared/scan-qrcode.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Observable, of, Subscription } from 'rxjs';
import { distinctUntilChanged, first } from 'rxjs/operators';

const PageSize = 10;

/**
 * Field used to select a user
 */
@Component({
  selector: 'user-field',
  templateUrl: 'user-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: UserFieldComponent, multi: true },
  ],
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
  @Input() principalTypes: PrincipalType[];
  @Input() allowSearch = true;
  @Input() allowContacts = true;
  @Input() allowQrCode = false;
  @Input() allowSelf = false;
  @Input() allowLocate = true;
  @Input() filters: UserQueryFilters;

  @ViewChild('contactListButton') contactListButton: ElementRef;
  private fieldSub: Subscription;

  placeholder = '';

  constructor(
    injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    private userCache: UserCacheService,
    private usersService: UsersService,
    private nextRequestState: NextRequestState,
    private modal: BsModalService,
    private errorHandler: ErrorHandlerService) {
    super(injector, controlContainer);
  }

  ngOnInit() {
    super.ngOnInit();
    this.fieldSub = this.inputFieldControl.valueChanges
      .pipe(distinctUntilChanged((l1, l2) => ApiHelper.locatorEquals(l1, l2)))
      .subscribe(value => this.setAsPrincipal(value));
    if (this.allowSearch) {
      this.placeholder = this.i18n.field.user.placeholderAllowSearch;
    } else if (this.allowPrincipal) {
      if (empty(this.principalTypes) || this.principalTypes.length > 3) {
        // Show a generic principal placeholder
        this.placeholder = this.i18n.field.user.placeholderPrincipal;
      } else {
        this.placeholder = this.principalTypes.map(t => t.name).join(' / ');
      }
    }

    const permissions = (this.dataForFrontendHolder.auth || {}).permissions || {};

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

  locateUser() {
    let text = this.inputFieldControl.value as string;
    text = (text || '').trim();
    if (text.startsWith('*:')) {
      text = text.substring(2);
    }
    if (text) {
      return this.errorHandler.requestWithCustomErrorHandler(() =>
        this.addSub(this.usersService.locateUser({ user: text }).subscribe(user => this.select(user),
          () => this.select(null))));
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
    text = (text || '').trim();
    if (text.startsWith('*:')) {
      text = text.substring(2);
    }
    if (!this.allowSearch || empty(text)) {
      return of([]);
    }

    const filters: UserQueryFilters = this.filters ? { ...this.filters } : {};
    filters.ignoreProfileFieldsInList = true;
    filters.pageSize = PageSize;
    filters.keywords = text;
    filters.usersToExclude = [...(filters.usersToExclude || [])];
    if (!this.allowSelf) {
      filters.usersToExclude.push(ApiHelper.SELF);
    }
    this.nextRequestState.leaveNotification = true;
    return this.usersService.searchUsers(filters);
  }

  toDisplay(user: User): string {
    return user.display;
  }

  toValue(user: User): string {
    if (user.locator) {
      return user.locator;
    }
    return `id:${user.id}`;
  }

  showContactList() {
    const ref = this.modal.show(PickContactComponent, {
      class: 'modal-form',
      initialState: {
        usersToExclude: (this.filters || {}).usersToExclude || [],
      },
    });
    const component = ref.content as PickContactComponent;
    component.select.pipe(first()).subscribe(u => this.user = u);
    this.modal.onHide.pipe(first()).subscribe(() => focus(this.inputField, true));
  }

  showScanQrCode() {
    const ref = this.modal.show(ScanQrCodeComponent, {
      class: 'modal-form',
    });
    const component = ref.content as ScanQrCodeComponent;
    component.select.pipe(first()).subscribe(value => this.setAsPrincipal(value));
    this.modal.onHide.pipe(first()).subscribe(() => focus(this.inputField, true));
  }

  setAsPrincipal(value: string) {
    if (!empty(value) && this.allowPrincipal) {
      let locator = value;
      if (!/^[\w\*]+\:/.test(locator)) {
        // When not already using a specific principal (such as id: when searching), use a wildcard
        locator = '*:' + locator;
      } else {
        locator = ApiHelper.escapeNumeric(locator);
      }
      this.value = locator;
      this.inputField.nativeElement.value = value;
    }
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
      this.user = null;
    }
  }

}
