
/**
 * Does the given value matches either value, id or internal name of the given option?
 * @param option The option to match
 * @param value The value to match
 */
export function fieldOptionMatches(option: FieldOption, value: any) {
  if (option == null || value == null) {
    return false;
  }
  if (option.value === value || option.value === value.value) {
    return true;
  }
  if (option.id && option.id === value.id) {
    return true;
  }
  if (option.internalName && option.internalName === value.internalName) {
    return true;
  }
  return false;
}

/**
 * Represents an option in an input field, such as selection / radio groups.
 */
export interface FieldOption {

  /** The internal value */
  value: string;

  /** The internal identifier */
  id?: string;

  /** The internal name */
  internalName?: string;

  /** The displayed text */
  text: string;

  /** The category it belongs */
  category?: string;

  /** The parent field option */
  parent?: string;

  /** The option level in a hierarchy */
  level?: number;

  /** The option is enabled for selection */
  enabled?: boolean;

  /** Option particular style */
  style?: string;
}
