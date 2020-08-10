import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  Operation,
  Wizard
} from 'app/api/models';
import { Configuration } from 'app/configuration';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';

/**
 * Helper for custom wizards
 */
@Injectable({
  providedIn: 'root',
})
export class WizardHelperService {
  private registry = new Map<string, Wizard>();

  constructor(
    private router: Router,
    dataForUiHolder: DataForUiHolder) {
    dataForUiHolder.subscribe(dataForUi => {
      // Store all custom operations in the registry
      const wizards = ((((dataForUi || {}).auth || {}).permissions || {}).wizards || {});
      (wizards.system || []).forEach(w => this.register(w.wizard));
      (wizards.my || []).forEach(w => this.register(w.wizard));
    });
  }

  /**
   * Registers a known wizard. Ingores null / undefined.
   */
  register(wizard: Wizard) {
    if (wizard) {
      this.registry.set(wizard.id, wizard);
      if (wizard.internalName) {
        this.registry.set(wizard.internalName, wizard);
      }
    }
  }

  /**
   * Returns a wizard by internal name or id
   */
  get(key: string): Operation {
    return this.registry.get(key);
  }

  /**
   * Returns the icon name that should be used for the given wizard
   */
  icon(wizard: Wizard): string {
    const config = (Configuration.wizards || {})[wizard.internalName || '#'];
    const customIcon = (config || {}).icon;
    return customIcon || 'play_circle_outline';
  }

  /**
   * Returns a heading action suitable to run the given wizard
   */
  headingAction(wizard: Wizard, user: string): HeadingAction {
    return new HeadingAction(this.icon(wizard), wizard.label || wizard.name, () => {
      this.router.navigate(['wizards', 'user', user, ApiHelper.internalNameOrId(wizard)]);
    });
  }
}
