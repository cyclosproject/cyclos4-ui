import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { FormGroup, FormBuilder } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

/**
 * Displays the settings page
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'settings',
  templateUrl: 'settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent extends BaseComponent {

  form: FormGroup;
  loaded = new BehaviorSubject(false);

  constructor(injector: Injector, formBuilder: FormBuilder) {
    super(injector);

    this.form = formBuilder.group({
      darkTheme: this.layout.darkTheme
    });
  }

  ngOnInit() {
    super.ngOnInit();
    setInterval(() => this.loaded.next(true), 100);
  }

  save() {
    this.layout.darkTheme = this.form.value.darkTheme;
  }
}
