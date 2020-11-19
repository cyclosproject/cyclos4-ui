import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Operation, Wizard } from 'app/api/models';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { SvgIcon } from 'app/core/svg-icon';

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
    dataForFrontendHolder: DataForFrontendHolder) {
    dataForFrontendHolder.subscribe(dataForFrontend => {
      // Store all custom operations in the registry
      const dataForUi = (dataForFrontend || {}).dataForUi;
      const auth = (dataForUi || {}).auth;
      const permissions = (auth || {}).permissions;
      const wizards = (permissions || {}).wizards || {};
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
  icon(wizard: Wizard): SvgIcon | string {
    return wizard.svgIcon || SvgIcon.FilePlay;
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
