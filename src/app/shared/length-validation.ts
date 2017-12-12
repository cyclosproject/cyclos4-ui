/**
 * Utility class used to validate the length of a string or array
 */
export class LengthValidation {
  constructor(public min: number = 0, public max: number = Number.MAX_SAFE_INTEGER) {}

  /**
   * Returns whether the given input's length is valid
   * @param value The string or array to validate
   */
  valid(value: string | Array<any>): boolean {
    return value.length >= this.min && value.length <= this.max;
  }
}
