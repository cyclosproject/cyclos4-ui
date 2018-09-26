/**
 * Defines the information a page needs to locate a `FormControl` for a specific field
 */
export interface FormControlLocator {
  property?: string;
  customField?: string;
  nestedProperty?: string;
  nestedIndex?: number;
}
