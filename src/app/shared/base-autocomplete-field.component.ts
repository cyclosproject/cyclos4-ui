import { ControlContainer, FormControl } from '@angular/forms';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import { ViewChild, ElementRef, OnDestroy, OnInit, Output, EventEmitter, AfterViewChecked, AfterViewInit, Input } from '@angular/core';
import { BsDropdownDirective } from 'ngx-bootstrap/dropdown';
import { BehaviorSubject, Observable } from 'rxjs';
import { empty, blank } from 'app/shared/helper';
import { InputFieldComponent } from 'app/shared/input-field.component';
import { debounceTime, distinctUntilChanged, switchMap, filter } from 'rxjs/operators';
import { ApiHelper } from 'app/shared/api-helper';

/**
 * Base class for fields that present a text field and searches for keywords
 * @param T The field data type
 * @param A The autocomplete results data type
 */
export abstract class BaseAutocompleteFieldComponent<T, A>
  extends BaseFormFieldComponent<T> implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {
  inputFieldControl: FormControl;
  @ViewChild('inputField') inputField: InputFieldComponent;
  @ViewChild('dropdown') dropdown: BsDropdownDirective;
  @ViewChild('dropDownMenu') menuRef: ElementRef;

  @Input() autoSearch = true;

  @Output() selected = new EventEmitter<A>();
  selection$ = new BehaviorSubject<A>(null);
  get selection(): A {
    return this.selection$.value;
  }
  set selection(value: A) {
    this.selection$.next(value);
  }
  options$ = new BehaviorSubject<A[]>(null);

  private inputInitialized = false;
  private inputHasFocus = false;
  private focusInput = false;
  private bodyListener: any;

  constructor(
    protected controlContainer: ControlContainer) {
    super(controlContainer);
    this.inputFieldControl = new FormControl(null);
  }

  ngOnInit() {
    super.ngOnInit();
    this.addSub(this.inputFieldControl.valueChanges.pipe(
      filter(text => blank(text))
    ).subscribe(() => {
      this.close();
    }));
    if (this.autoSearch) {
      this.addSub(this.inputFieldControl.valueChanges.pipe(
        filter(text => !blank(text)),
        debounceTime(ApiHelper.DEBOUNCE_TIME),
        distinctUntilChanged(),
        switchMap(text => this.query(text))
      ).subscribe(rows => {
        if (blank(this.inputFieldControl.value)) {
          this.options$.next([]);
        } else {
          this.options$.next(rows);
          if (!empty(rows)) {
            this.open();
          }
        }
      }));
    }
    this.addSub(this.formControl.statusChanges.subscribe(status => {
      // We should delegate the error to the input field control, so it is correctly marked as error
      if (status === 'INVALID') {
        this.inputFieldControl.setErrors(this.formControl.errors);
      } else if (status === 'VALID') {
        this.inputFieldControl.setErrors(null);
      }
    }));
    this.bodyListener = e => this.close();
  }

  search(text?: string) {
    if (blank(text)) {
      text = this.inputFieldControl.value;
    }
    if (blank(text)) {
      this.options$.next([]);
      this.close();
    } else {
      this.addSub(this.query(text).subscribe(rows => {
        this.options$.next(rows);
        if (!empty(rows)) {
          this.open();
        }
      }));
    }
  }

  ngAfterViewInit() {
    this.dropdown.onShown.subscribe(() => {
      document.body.addEventListener('click', this.bodyListener, false);
    });
    this.dropdown.onHidden.subscribe(() => {
      document.body.removeEventListener('click', this.bodyListener, false);
    });
  }

  ngAfterViewChecked() {
    if (this.inputField) {
      if (!this.inputInitialized) {
        // When initializing, it is possible that the input field is initially hidden, for there could be a selection
        this.addSub(this.inputField.onfocus.subscribe(() => this.inputHasFocus = true));
        this.addSub(this.inputField.onblur.subscribe(() => {
          this.inputHasFocus = false;
          setTimeout(() => this.close(), 200);
        }));
      }
      if (this.focusInput) {
        this.inputField.focus();
        this.focusInput = false;
      }
    }
  }

  onValueInitialized() {
    if (!empty(this.value)) {
      this.fetch(this.value).subscribe(res => {
        this.select(res);
      });
    }
  }

  /**
   * Must be implemented in order to fetch the autocomplete data from the given initial value
   * @param value The initial value
   */
  protected abstract fetch(value: T): Observable<A>;

  /**
   * Must be implemented in order to fetch the autocomplete results matching the given text
   * @param text The query text
   */
  protected abstract query(text: string): Observable<A[]>;

  /**
   * Must be implemented to return a display text for the given autocomplete result
   */
  abstract toDisplay(value: A): string;

  /**
   * Must be implemented to return the internal value for the given autocomplete result
   */
  abstract toValue(value: A): T;

  protected getFocusableControl() {
    return this.inputField;
  }

  onShown() {
    const input = <HTMLElement>this.inputField.inputRef.nativeElement;
    const rect = input.getBoundingClientRect();
    const docHeight = (window.innerHeight || document.documentElement.clientHeight);
    this.dropdown.dropup = rect.bottom > docHeight - 100;
    // Workaround: ngx-bootstrap sets top sometimes when we set dropup, which causes a position error
    setTimeout(() => this.menuRef.nativeElement.style.top = '', 1);
  }

  onDisabledChange(isDisabled: boolean): void {
    this.inputField.disabled = isDisabled;
  }

  /**
   * Selects the given autocomplete value, emitting the event
   * @param value The value
   */
  select(value: A) {
    this.value = value == null ? null : this.toValue(value);
    this.selection = value;
    this.selected.emit(value);
    this.close();
    this.inputFieldControl.setValue(value);
    this.focusInput = value == null;
  }

  protected getDisabledValue(): string {
    return this.selection ? this.toDisplay(this.selection) : String(this.value || '');
  }

  close() {
    if (this.dropdown) {
      this.dropdown.hide();
    }
    this.options$.next(null);
  }

  open() {
    if (this.inputHasFocus) {
      // Only open the dropdown if the input still has focus
      this.dropdown.show();
    }
  }
}
