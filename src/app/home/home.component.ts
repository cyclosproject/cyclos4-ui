import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { filter } from 'rxjs/operators/filter';

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

  loaded = new BehaviorSubject(false);

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
    this.form.valueChanges.subscribe(v => console.dir(v));
  }

  ngOnInit() {
    super.ngOnInit();
    if (this.format.dataForUi != null) {
      this.loaded.next(true);
    } else {
      this.format.materialDateFormats.subscribe(() => {
        this.loaded.next(true);
      });
    }
  }
}
