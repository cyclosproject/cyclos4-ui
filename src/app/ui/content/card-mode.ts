/**
 * How the layout is made within a card.
 * Possible options:
 *
 * - `normal`: The card pads the content, and the height is adjusted according to the content.
 * - `tight`: No padding is added to the content, and the height is adjusted according to the content.
 * - `viewForm`: The card has slightly more vertical than horizontal padding, and is used when a read-only form is presented.
 * - `filters`: The card as some padding adjustments to display a form used as search filters.
 * - `emptyFilters`: The card as some padding adjustments to display a form used as search filters.
 * - `table`: The card will display solely a table: no padding is added, and some adjustments to internal table CSS is done.
 * - `transparent` The card has no borders, but still has padding.
 * - `fullHeight`: The card pads the content and the minimum height is the available height until the bottom of the browser window.
 * - `fullHeightTight`: Like `fullHeight`, but without padding.
 * - `empty`: Just title, no content
 */
export type CardMode =
  | 'normal'
  | 'tight'
  | 'viewForm'
  | 'filters'
  | 'emptyFilters'
  | 'table'
  | 'transparent'
  | 'fullHeight'
  | 'fullHeightTight'
  | 'empty';
