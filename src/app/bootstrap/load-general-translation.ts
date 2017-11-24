import { FormatService } from "app/core/format.service";
import { TranslationLoaderService } from "app/core/translation-loader.service";
import { UIService } from "app/api/services";
import { UiKind, DataForUi } from "app/api/models";
import { Provider, APP_INITIALIZER } from "@angular/core";
import { GeneralMessages } from "app/messages/general-messages";

// Load the general keys before showing
export function loadGeneralTranslation(
  translationLoaderService: TranslationLoaderService,
  generalMessages: GeneralMessages): Function {
  return () => translationLoaderService.load('general')
    .then(keys => generalMessages.initialize(keys))
}
export const LOAD_GENERAL_TRANSLATION: Provider = {
  provide: APP_INITIALIZER,
  useFactory: loadGeneralTranslation,
  deps: [TranslationLoaderService, GeneralMessages],
  multi: true
};
