import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FieldOption } from 'app/shared/field-option';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';

/**
 * Manages the user settings
 */
@Component({
  selector: 'manage-settings',
  templateUrl: 'manage-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManageSettingsComponent
  extends BasePageComponent<boolean>
  implements OnInit {

  darkThemeControl: FormControl;
  canSwitchFrontend: boolean;

  localeControl: FormControl;
  localeOptions: FieldOption[];

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.data = true;
  }

  onDataInitialized() {
    this.darkThemeControl = new FormControl(this.layout.darkTheme);
    this.addSub(this.darkThemeControl.valueChanges.subscribe(value => {
      this.layout.darkTheme = value;
    }));

    const dataForUi = this.dataForFrontendHolder.dataForFrontend.dataForUi;
    const locales = dataForUi.allowedLocales;
    if (locales.length > 1) {
      this.localeControl = new FormControl(dataForUi.currentLocale?.code);
      this.localeOptions = locales.map(l => (
        { value: l.code, text: l.name }
      ));
      this.addSub(this.localeControl.valueChanges.subscribe(locale => this.authHelper.setLocale(locale)));
    }

    this.canSwitchFrontend = this.dataForFrontendHolder.dataForFrontend.allowFrontendSwitching;
  }

  switchFrontend() {
    this.dataForFrontendHolder.useClassicFrontend();
  }

  resolveMenu() {
    return Menu.SETTINGS;
  }
}
