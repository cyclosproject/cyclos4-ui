import { Component, OnInit, Input, ChangeDetectorRef, Provider, forwardRef, ChangeDetectionStrategy } from '@angular/core';
import { UserDataForSearch, User } from "app/api/models";
import { TableDataSource } from "app/shared/table-datasource";
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from "@angular/forms";
import { Subject } from "rxjs/Subject";
import { debounceTime, distinctUntilChanged, switchMap } from "rxjs/operators";
import { UsersService } from "app/api/services";
import { GeneralMessages } from "app/messages/general-messages";
import { ApiHelper } from "app/shared/api-helper";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Observable } from 'rxjs/Observable';
import { UserResult } from 'app/api/models/user-result';

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
export class UserSelectionComponent implements OnInit, ControlValueAccessor {
  constructor(
    public generalMessages: GeneralMessages,
    private usersService: UsersService) {
  }
    
  @Input()
  focused: boolean | string;
  
  onKeywords = new Subject<string>();
  showTable = new BehaviorSubject<boolean>(false);
  
  dataSource: TableDataSource<User> = new TableDataSource();

  private _value: string
  get value(): string {
    return this._value;
  }
  set value(val: string) {
    this._value = val;
    this.changeCallback(val);
  }

  private changeCallback = (_: any) => { };
  private touchedCallback = () => { };

  @Input()
  public dataForSearch: UserDataForSearch;

  ngOnInit() {
    this.onKeywords.pipe(
      debounceTime(350),
      distinctUntilChanged(),
    ).subscribe(keywords => {
      this.search(keywords);
    });
  }

  private search(keywords: string) {
    let showTable = keywords != null && keywords.length > 0;
    if (showTable) {
      this.dataSource.subscribe(
       this.usersService.searchUsers({
        keywords: keywords,
        pageSize: ApiHelper.quickSearchPageSize,
        ignoreProfileFieldsInList: true
      }))
    } else {
      this.value = null;
      this.dataSource.next([]);
    }
    this.showTable.next(showTable);
  }

  writeValue(obj: any): void {
    this.value = obj
  }
  registerOnChange(fn: any): void {
    this.changeCallback = fn;
  }
  registerOnTouched(fn: any): void {
    this.touchedCallback = fn;
  }
  setDisabledState(isDisabled: boolean): void {
  }
}