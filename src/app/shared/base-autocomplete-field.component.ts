import { AfterViewInit, Directive, ElementRef, EventEmitter, Injector, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { ControlContainer, FormControl } from '@angular/forms';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import { blank, empty } from 'app/shared/helper';
import { LayoutService } from 'app/core/layout.service';
import { BsDropdownDirective } from 'ngx-bootstrap/dropdown';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs/operators';

/**
 * Base class for fields that present a text field and searches for keywords.
 * @param T The field data type
 * @param A The autocomplete results data type
 */
@Directive()
export abstract class BaseAutocompleteFieldComponent<T, A>
  extends BaseFormFieldComponent<T> implements OnInit, OnDestroy, AfterViewInit {
  inputFieldControl: FormControl;
  @ViewChild('inputField') inputField: ElementRef<HTMLInputElement>;
  @ViewChild('dropdown') dropdown: BsDropdownDirective;

  @Input() autoSearch = true;

  @Output() selected = new EventEmitter<A>();
  selection$ = new BehaviorSubject<A>(null);
  get selection(): A {
    return this.selection$.value;
  }
  set selection(value: A) {
    this.select(value);
  }
  options$ = new BehaviorSubject<A[]>(null);

  allowOptions = true;

  private bodyListener: any;

  layout: LayoutService;

  constructor(
    injector: Injector,
    protected controlContainer: ControlContainer) {
    super(injector, controlContainer);
    this.inputFieldControl = new FormControl(null);
    this.layout = injector.get(LayoutService);
  }

  ngOnInit() {
    super.ngOnInit();
    this.addSub(this.inputFieldControl.valueChanges.pipe(
      filter(text => blank(text)),
    ).subscribe(() => {
      this.close();
    }));
    if (this.autoSearch && this.allowOptions) {
      this.addSub(this.inputFieldControl.valueChanges.pipe(
        filter(text => !blank(text)),
        debounceTime(ApiHelper.DEBOUNCE_TIME),
        distinctUntilChanged(),
        switchMap(text => this.query(text)),
      ).subscribe(rows => {
        if (!this.allowOptions || blank(this.inputFieldControl.value)) {
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
    this.bodyListener = () => this.close();
  }

  search(text?: string) {
    if (!this.allowOptions) {
      return;
    }
    if (blank(text)) {
      text = this.inputFieldControl.value;
    }
    if (blank(text)) {
      this.options$.next([]);
      this.close();
    } else {
      this.addSub(this.query(text).subscribe(rows => {
        if (this.allowOptions) {
          this.options$.next(rows);
          if (!empty(rows)) {
            this.open();
          }
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

  onValueInitialized() {
    if (empty(this.value)) {
      this.select(null);
    } else {
      this.fetch(this.value).subscribe(res => {
        this.select(res, this.value, {
          emitEvent: false,
        });
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
    if (!this.inputField) {
      return;
    }
    const input = this.inputField.nativeElement as HTMLInputElement;
    const rect = input.getBoundingClientRect();
    const docHeight = (window.innerHeight || document.documentElement.clientHeight);
    this.dropdown.dropup = rect.bottom > docHeight - 100;
    this.layout.setFocusTrap(this.dropdownMenuId);

    // To manipulate the menu, we need to give time to ngx-bootstrap to append it to the body
    setTimeout(() => {
      const menu = document.getElementById(this.dropdownMenuId);

      // Workaround: ngx-bootstrap sets top sometimes when we set dropup, which causes a position error
      menu.style.top = '';

      // Make sure the menu is at least the same width as the input
      menu.style.minWidth = `${input.getBoundingClientRect().width}px`;
      menu.style.visibility = 'visible';
    });
  }

  onHidden() {
    this.layout.setFocusTrap(null);
  }

  onDisabledChange(isDisabled: boolean): void {
    const input = this.inputField.nativeElement as HTMLInputElement;
    input.disabled = isDisabled;
  }

  /**
   * Selects the given autocomplete value, emitting the event
   * @param selected The selected value
   * @param value The internal value to be set
   */
  select(selected: A, value?: T, options?: { emitEvent?: boolean }) {
    options = options || {};
    const newValue = value || (selected == null ? null : this.toValue(selected));
    if (this.value !== newValue) {
      this.value = newValue;
    }
    this.selection$.next(selected);
    if (options.emitEvent !== false) {
      this.selected.emit(selected);
    }
    this.close();
    if (selected == null) {
      this.inputFieldControl.setValue(null, options);
    } else if (this.inputFieldControl.value !== newValue) {
      this.inputFieldControl.setValue(newValue, options);
    }
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
    this.dropdown.show();
  }

  ngClassFor(option: A, index: number): any {
    const result = {
      'mt-1': index > 0,
      selected: this.value === this.toValue(option),
    };
    result[`autocomplete-option-${index}`] = true;
    return result;
  }

  protected onEscapePressed() {
    this.select(null);
  }

  get dropdownMenuId() {
    return `dropdown-menu-${this.id}`;
  }
}
