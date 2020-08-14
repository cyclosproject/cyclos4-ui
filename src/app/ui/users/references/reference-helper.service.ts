import { Injectable } from '@angular/core';
import { ReferenceLevelEnum } from 'app/api/models';
import { I18n } from 'app/i18n/i18n';

/**
 * Helper service for references functions
 */
@Injectable({
  providedIn: 'root',
})
export class ReferenceHelperService {

  constructor(
    private i18n: I18n) {
  }

  resolveLevelLabel(level: ReferenceLevelEnum) {
    switch (level) {
      case ReferenceLevelEnum.BAD:
        return this.i18n.reference.level.bad;
      case ReferenceLevelEnum.VERY_BAD:
        return this.i18n.reference.level.veryBad;
      case ReferenceLevelEnum.GOOD:
        return this.i18n.reference.level.good;
      case ReferenceLevelEnum.VERY_GOOD:
        return this.i18n.reference.level.veryGood;
      case ReferenceLevelEnum.NEUTRAL:
        return this.i18n.reference.level.neutral;
    }
  }
}
