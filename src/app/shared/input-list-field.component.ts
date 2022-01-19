import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component,
  Host, Injector, Input, OnDestroy, OnInit, Optional, QueryList, SkipSelf, ViewChildren
} from '@angular/core';
import { ControlContainer, FormArray, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import { empty, focus } from 'app/shared/helper';
import { InputFieldComponent } from 'app/shared/input-field.component';
import { Subscription } from 'rxjs';

/**
 * Component used to display a list of input fields
 */
@Component({
  selector: 'input-list-field',
  templateUrl: 'input-list-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: InputListFieldComponent, multi: true },
  ],
})
export class InputListFieldComponent
  extends BaseFormFieldComponent<string[]> implements OnInit, OnDestroy {

  @Input() maxItems: number;

  @ViewChildren(InputFieldComponent) inputs: QueryList<InputFieldComponent>;

  array: FormArray;
  arraySubs: Subscription[] = [];

  constructor(
    injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    private changeDetector: ChangeDetectorRef) {
    super(injector, controlContainer);
  }

  ngOnInit() {
    this.array = new FormArray([new FormControl(null)]);
    this.setupArraySubs();
  }

  ngOnDestroy() {
    this.arraySubs.forEach(s => s.unsubscribe());
  }

  getFocusableControl() {
    return this.inputs.first;
  }

  getControl(index: number) {
    return this.array.controls[index];
  }

  add() {
    this.array.insert(this.array.length, new FormControl(null));
    this.setupArraySubs();
    setTimeout(() => focus(this.inputs.last));
  }

  remove(index: number) {
    this.array.removeAt(index);
    this.arraySubs[index].unsubscribe();
    this.arraySubs.splice(index, 1);
    this.value = this.array.value.filter((a: any) => !empty(a));
  }

  writeValue(obj: any) {
    super.writeValue(obj);
    const array = obj instanceof Array ? obj : empty(obj) ? [] : [];
    this.array.clear();
    if (array.length === 0) {
      this.array = new FormArray([new FormControl(null)]);
    } else {
      this.array = new FormArray(array.map(v => new FormControl(v)));
    }
    this.setupArraySubs();
    this.changeDetector.detectChanges();
  }

  protected getDisabledValue(): string {
    return (this.array.value || []).filter((v: any) => !empty(v)).join(', ');
  }

  private setupArraySubs() {
    this.arraySubs.forEach(s => s.unsubscribe());
    this.arraySubs = this.array.controls.map(
      (c, i) => c.valueChanges.subscribe(
        current => {
          const arrayValue = this.array.value;
          arrayValue[i] = current;
          this.value = arrayValue.filter((a: any) => !empty(a));
        }));
  }

}
