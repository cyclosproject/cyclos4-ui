import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { FormBuilder, FormGroup } from '@angular/forms';

/**
 * Displays the home page
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'home',
  templateUrl: 'home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent extends BaseComponent {

  form: FormGroup;

  constructor(injector: Injector, formBuilder: FormBuilder) {
    super(injector);

    this.form = formBuilder.group({
      singleLine: null,
      multiLine: null,
      checkBox: null,
      radio: '1',
      decimal: null,
      date: null,
      singleSelection: null,
      multiSelection: null
    });
  }
}
