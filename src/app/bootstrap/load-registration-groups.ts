import { TranslationLoaderService } from 'app/core/translation-loader.service';
import { Provider, APP_INITIALIZER } from '@angular/core';
import { GeneralMessages } from 'app/messages/general-messages';
import { RegistrationGroupsResolve } from 'app/registration-groups.resolve';
import { GroupForRegistration } from '../api/models';

// Load the groups available for registration before loading the application
export function loadRegistrationGroups(
  registrationGroups: RegistrationGroupsResolve): Function {
  return () => registrationGroups.data;
}
export const LOAD_REGISTRATION_GROUPS: Provider = {
  provide: APP_INITIALIZER,
  useFactory: loadRegistrationGroups,
  deps: [RegistrationGroupsResolve],
  multi: true
};
