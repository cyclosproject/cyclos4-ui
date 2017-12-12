import {
  Component, OnInit, Input, Provider, forwardRef, ChangeDetectionStrategy,
  SkipSelf, Host, Optional, ElementRef, ViewChild
} from '@angular/core';
import { UserDataForSearch, User } from 'app/api/models';
import { TableDataSource } from 'app/shared/table-datasource';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, ControlContainer, FormControl } from '@angular/forms';
import { Subject } from 'rxjs/Subject';
import { debounceTime } from 'rxjs/operators/debounceTime';
import { distinctUntilChanged } from 'rxjs/operators/distinctUntilChanged';
import { UsersService } from 'app/api/services';
import { GeneralMessages } from 'app/messages/general-messages';
import { ApiHelper } from 'app/shared/api-helper';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { BaseControlComponent } from 'app/shared/base-control.component';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PAYMENT_USER_VALUE_ACCESSOR]
})
export class UserSelectionComponent extends BaseControlComponent<string> {
  @Input()
  focused: boolean | string;

  @Input()
  dataForSearch: UserDataForSearch;

  onKeywords = new Subject<string>();
  showTable = new BehaviorSubject<boolean>(false);

  dataSource: TableDataSource<User> = new TableDataSource();

  @ViewChild('keywordsInput') keywordsInput: ElementRef;

  constructor(
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    public generalMessages: GeneralMessages,
    private usersService: UsersService) {
    super(controlContainer);
  }

  ngOnInit() {
    super.ngOnInit();
    this.onKeywords.pipe(
      debounceTime(ApiHelper.DEBOUNCE_TIME),
      distinctUntilChanged(),
    ).subscribe(keywords => {
      this.search(keywords);
    });
  }

  private search(keywords: string) {
    const showTable = keywords != null && keywords.length > 0;
    if (showTable) {
      this.dataSource.subscribe(
       this.usersService.searchUsers({
        keywords: keywords,
        pageSize: ApiHelper.quickSearchPageSize,
        ignoreProfileFieldsInList: true
      }));
    } else {
      this.value = null;
      this.dataSource.next([]);
    }
    this.showTable.next(showTable);
  }

  onDisabledChange(isDisabled: boolean): void {
    if (this.keywordsInput) {
      this.keywordsInput.nativeElement.disabled = isDisabled;
    }
  }
}
