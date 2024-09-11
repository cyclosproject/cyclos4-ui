import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ReferenceLevelEnum } from 'app/api/models';
import { SvgIcon } from 'app/core/svg-icon';
import { ReferenceHelperService } from 'app/ui/users/references/reference-helper.service';

/**
 * Shows rating statistics (from 1 to 5 stars)
 */
@Component({
  selector: 'rating-stats',
  templateUrl: 'rating-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RatingStatsComponent {
  /**
   * From 1 to 5 allowing decimals
   */
  @Input() score: string | number = 0;

  @Input() level: ReferenceLevelEnum;

  @Input() textLeft: string;
  @Input() textRight: string;

  constructor(private referenceHelper: ReferenceHelperService) {}

  /**
   * Returns a score between 1 and 5 based on
   * the given input score or reference level
   */
  get _score(): number {
    if (this.level) {
      switch (this.level) {
        case ReferenceLevelEnum.VERY_BAD:
          return 1;
        case ReferenceLevelEnum.BAD:
          return 2;
        case ReferenceLevelEnum.NEUTRAL:
          return 3;
        case ReferenceLevelEnum.GOOD:
          return 4;
        case ReferenceLevelEnum.VERY_GOOD:
          return 5;
      }
    } else if (this.score) {
      return +this.score;
    }
    return 0;
  }

  /**
   * Resolves statistics color based on current score
   */
  resolveStyle() {
    const score = this._score;
    if (score > 0 && score < 2) {
      return 'red';
    } else if (score >= 2 && score < 3) {
      return 'orange';
    } else if (score >= 3 && score < 4) {
      return 'yellow';
    } else if (score >= 4 && score < 5) {
      return 'green';
    } else if (score === 5) {
      return 'darkGreen';
    }
    return '';
  }

  /**
   * Resolves a label when there is a level input
   */
  resolveLevelLabel() {
    if (this.level) {
      return this.referenceHelper.resolveLevelLabel(this.level);
    }
  }

  /**
   * Resolves the icon for the current level which can be a full, half or empty star
   */
  resolveIcon(level: number): SvgIcon {
    if (level <= this._score) {
      return SvgIcon.StarFill;
    } else if (this._score < level && this._score > level - 1) {
      return SvgIcon.StarHalf;
    } else {
      return SvgIcon.Star;
    }
  }
}
