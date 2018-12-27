
/**
 * Does the given value matches either value, id or internal name of the given option?
 * @param option The option to match
 * @param value The value to match
 */
export function fieldOptionMatches(option: FieldOption, value: string | FieldOption) {
  if (option == null || value == null) {
    return false;
  }
  if (typeof value === 'object') {
    return option === value
      || option.id != null && option.id === value.id
      || option.internalName != null && option.internalName === value.internalName;
  } else {
    return option.value === value
      || option.id != null && option.id === value
      || option.internalName != null && option.internalName === value;
  }
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
}
