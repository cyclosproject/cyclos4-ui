import { Component, OnInit, Input, ChangeDetectorRef, Provider, forwardRef, ChangeDetectionStrategy } from '@angular/core';
import { UserDataForSearch, User } from "app/api/models";
import { TableDataSource } from "app/shared/table-datasource";
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from "@angular/forms";
import { Subject } from "rxjs/Subject";
import "rxjs/add/operator/debounceTime";
import "rxjs/add/operator/distinctUntilChanged";
import { UsersService } from "app/api/services";
import { GeneralMessages } from "app/messages/general-messages";
import { ModelHelper } from "app/shared/model-helper";
import { BehaviorSubject } from "rxjs/BehaviorSubject";

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
    private changeDetector: ChangeDetectorRef,
    private usersService: UsersService) { }

  onKeywords = new Subject<string>();

  @Input()
  focused: boolean | string;

  showTable = new BehaviorSubject<boolean>(false);
  
  dataSource: TableDataSource<User> = new TableDataSource(this.changeDetector);

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
    this.onKeywords.asObservable()
      .debounceTime(350)
      .distinctUntilChanged()
      .subscribe(keywords => this.search(keywords));
  }

  private search(keywords: string): void {
    let showTable = keywords != null && keywords.length > 0;
    if (showTable) {
      this.usersService.searchUsers({
        keywords: keywords,
        pageSize: ModelHelper.quickSearchPageSize,
        ignoreProfileFieldsInList: true
      })
      .then(response => {
        this.dataSource.data = response.data;
      });
    } else {
      this.value = null;
      this.dataSource.data = [];
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