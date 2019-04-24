import moment from 'moment-mini-ts';

/**
 * A constraint to be used either as minimum / maximum date
 */
export type DateConstraint =
  /** Any date */
  'any' |
  /** Current date, begin of day */
  'today' |
  /** Current date, end of date */
  'todayEnd' |
  /** Current date + 1 */
  'tomorrow' |
  /** Current date - 1 */
  'yesterday' |
  /** 100 years ago */
  'past100' |
  /** 100 years from now */
  'future100' |
  /** 5 years ago */
  'past5' |
  /** 5 years from now */
  'future5' |
  /** A specific date */
  string;

/**
 * Returns a date constraint as a moment instance
 * @param constraint The constraint
 * @returns The corresponding moment, or null if the constraint is null or 'any'
 */
export function dateConstraintAsMoment(constraint: DateConstraint, now: moment.Moment): moment.Moment {
  switch (constraint || 'any') {
    case 'any':
      return null;
    case 'today':
      return now.clone().startOf('day');
    case 'todayEnd':
      return now.clone().endOf('day');
    case 'yesterday':
      return now.clone().subtract(1, 'day').startOf('day');
    case 'tomorrow':
      return now.clone().add(1, 'day').startOf('day');
    case 'past100':
      return now.clone().subtract(100, 'years').startOf('year');
    case 'future100':
      return now.clone().add(100, 'years').endOf('year');
    case 'past5':
      return now.clone().subtract(5, 'years').startOf('year');
    case 'future5':
      return now.clone().add(5, 'years').endOf('year').startOf('day');
    default:
      const date = moment(constraint);
      if (!date.isValid()) {
        throw new Error(`Got an invalid date constraint: ${constraint}`);
      }
      return date;
  }
}
