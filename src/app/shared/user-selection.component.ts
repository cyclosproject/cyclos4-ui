import {
  Component, Input, Provider, forwardRef, ChangeDetectionStrategy,
  SkipSelf, Host, Optional, ElementRef, ViewChild
} from '@angular/core';
import { UserDataForSearch, UserResult } from 'app/api/models';
import { NG_VALUE_ACCESSOR, ControlContainer } from '@angular/forms';
import { debounceTime } from 'rxjs/operators/debounceTime';
import { distinctUntilChanged } from 'rxjs/operators/distinctUntilChanged';
import { UsersService } from 'app/api/services';
import { Messages } from 'app/messages/messages';
import { ApiHelper } from 'app/shared/api-helper';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { BaseControlComponent } from 'app/shared/base-control.component';
import { Observable } from 'rxjs/Observable';
import { switchMap } from 'rxjs/operators/switchMap';
import { of as observableOf } from 'rxjs/observable/of';

// Definition of the exported NG_VALUE_ACCESSOR provider
export const PAYMENT_USER_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => UserSelectionComponent),
  multi: true
};

/**
 * Displays a keyword filter plus a result table with the users to choose.
 * Each table row has a radio button which can toggle the user
 */
@Component({
  selector: 'user-selection',
  templateUrl: 'user-selection.component.html',
  styleUrls: ['user-selection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PAYMENT_USER_VALUE_ACCESSOR]
})
export class UserSelectionComponent extends BaseControlComponent<string> {
  @Input()
  focused: boolean | string;

  @Input()
  dataForSearch: UserDataForSearch;

  keywords = new BehaviorSubject<string>(null);

  users$: Observable<UserResult[]>;

  @ViewChild('keywordsInput') keywordsInput: ElementRef;

  constructor(
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    public messages: Messages,
    private usersService: UsersService) {
    super(controlContainer);
  }

  ngOnInit() {
    super.ngOnInit();
    this.users$ = this.keywords.pipe(
      debounceTime(ApiHelper.DEBOUNCE_TIME),
      distinctUntilChanged(),
      switchMap(keywords => this.doSearch(keywords)));
  }

  search(keywords: string): void {
    this.keywords.next(keywords);
  }

  private doSearch(keywords: string): Observable<UserResult[]> {
    const showUsers = keywords != null && keywords.length > 0;
    if (showUsers) {
      return this.usersService.searchUsers({
        keywords: keywords,
        pageSize: ApiHelper.quickSearchPageSize,
        usersToExclude: ['self'],
        ignoreProfileFieldsInList: true
      });
    } else {
      this.value = null;
      return observableOf([]);
    }
  }

  onDisabledChange(isDisabled: boolean): void {
    if (this.keywordsInput) {
      this.keywordsInput.nativeElement.disabled = isDisabled;
    }
  }
}
