import { ControlContainer } from '@angular/forms';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import { FieldOption, fieldOptionMatches } from 'app/shared/field-option';
import { BehaviorSubject } from 'rxjs';
import { empty } from 'app/shared/helper';
import { InjectionToken, Input } from '@angular/core';

export const FIELD_OPTIONS_SORTER = (a: FieldOption, b: FieldOption) => {
  if (a.category == null && b.category != null) {
    return -1;
  } else if (b.category == null && a.category != null) {
    return 1;
  } else {
    return a.text.localeCompare(b.text);
  }
};

/**
 * Injection token used to provide the parent component to options.
 */
export const FORM_FIELD_WITH_OPTIONS =
  new InjectionToken<BaseFormFieldWithOptionsComponent<any>>('FORM_FIELD_WITH_OPTIONS');

/**
 * Represents a category with options that can be added / removed
 */
export class CategoryWithOptions {
  constructor(public name: string) { }
  options = new BehaviorSubject<FieldOption[]>([]);
  private optionsByValue = new Map<string, FieldOption>();

  add(option: FieldOption) {
    const existing = this.optionsByValue.get(option.value);
    const current = this.options.value;
    if (existing) {
      // Already exists - replace the current one
      const newOptions = current.slice();
      newOptions.splice(newOptions.indexOf(existing), 1, option);
      this.options.next(newOptions);
    } else {
      // Is new: add it
      this.options.next([...current, option]);
    }
    // Add to the map
    this.optionsByValue.set(option.value, option);
  }

  remove(option: FieldOption) {
    const existing = this.optionsByValue.get(option.value);
    if (existing) {
      const newOptions = this.options.value.slice();
      newOptions.splice(newOptions.indexOf(existing), 1);
      this.options.next(newOptions);
    }
    // Remove from the map
    this.optionsByValue.delete(option.value);
  }
}

/**
 * Base class for custom form controls that have options
 */
export abstract class BaseFormFieldWithOptionsComponent<T> extends BaseFormFieldComponent<T> {

  categories = new BehaviorSubject<CategoryWithOptions[]>([]);

  constructor(protected controlContainer: ControlContainer) {
    super(controlContainer);
  }

  @Input() set fieldOptions(options: FieldOption[]) {
    (options || []).forEach(option => this.addOption(option));
  }

  /**
   * Finds the existing option by value, returning `undefined` if none is found
   */
  findOption(value: string): FieldOption {
    for (const category of this.categories.value) {
      for (const option of category.options.value) {
        if (fieldOptionMatches(option, value)) {
          return option;
        }
      }
    }
    return undefined;
  }

  /**
   * Finds options by a parent value
   * @param parent The parent value
   */
  optionsByParent(parent: string): FieldOption[] {
    const parentOption = this.findOption(parent);

    const result: FieldOption[] = [];
    for (const category of this.categories.value) {
      for (const option of category.options.value) {
        if ((parentOption && option.parent && fieldOptionMatches(parentOption, option.parent))
          || !parentOption && !option.parent) {
          result.push(option);
        }
      }
    }
    return result;
  }

  /**
   * Adds an option to this field
   */
  addOption(option: FieldOption) {
    let category = this.categoryFor(option);
    if (category == null) {
      // First option in this category
      category = new CategoryWithOptions(empty(option.category) ? null : option.category);
      this.categories.next([...this.categories.value, category]);
    }
    category.add(option);
  }

  /**
   * Removes an option from this field
   */
  removeOption(option: FieldOption) {
    const category = this.categoryFor(option);
    if (category) {
      category.remove(option);
    }
  }

  /**
   * Returns the array of selected values
   */
  get selectedValues(): string[] {
    return this.getSelectedValues();
  }

  protected abstract getSelectedValues(): string[];

  /**
   * Returns the array of selected options
   */
  get selectedOptions(): FieldOption[] {
    return this.selectedValues.map(value => this.findOption(value)).filter(opt => !!opt);
  }

  isSelected(value: string | FieldOption): boolean {
    if (typeof value === 'string') {
      return this.selectedOptions.find(opt => fieldOptionMatches(opt, value)) != null;
    } else {
      return this.selectedValues.find(val => fieldOptionMatches(value, val)) != null;
    }
  }

  private categoryFor(option: FieldOption): CategoryWithOptions {
    const finder = empty(option.category)
      ? (c: CategoryWithOptions) => empty(c.name)
      : (c: CategoryWithOptions) => c.name === option.category;
    return this.categories.value.find(finder);
  }

  protected getDisabledValue(): string {
    return this.selectedOptions.map(option =>
      option.category ? `${option.category} - ${option.text}` : option.text
    ).join(', ');
  }

}
