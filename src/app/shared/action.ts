import { Breakpoint } from 'app/shared/layout.service';

/**
 * A custom action descriptor
 */
export class Action {
  constructor(
    public label: string,
    public onClick: (param?: any) => void
  ) {
  }
}

/**
 * An action with a custom icon
 */
export class ActionWithIcon extends Action {
  constructor(
    public icon: string,
    label: string,
    onClick: (param?: any) => void
  ) {
    super(label, onClick);
  }
}


/**
 * An action shown in the page heading.
 * Several actions may be grouped in a single 'Actions' dropdown.
 * If there's a single action, uses the `maybeRoot` flag
 * to determine if it will still be in the 'Actions' dropdown,
 * or directly in the heading bar.
 */
export class HeadingAction extends ActionWithIcon {
  /**
   * Indicates where the action is displayed
   *
   * - `default`: For xxs will be shown in the top bar, for xs in the 
   *   actions button next to the title and for larger, if a toolbar is
   *   available, in the toolbar;
   * - `title`: Always shown in the page title, even if a toolbar is available
   * - `right`: If a toolbar is available, shows right-aligned in the toolbar.
   *   Otherwise, works as `default`.
   */
  position: 'default' | 'title' | 'right' = 'default';
  breakpoint: Breakpoint;
  constructor(
    icon: string,
    label: string,
    onClick: (param?: any) => void,
    public maybeRoot = false
  ) {
    super(icon, label, onClick);
  }

  /**
   * Returns whether this action should be displayed in the title bar, given the presence of a toolbar
   */
  showOnTitle(hasActionsToolbar: boolean): boolean {
    if (hasActionsToolbar) {
      // When a toolbar is used, only show on title specific actions
      return this.position === 'title';
    } else {
      // When no toolbar, show any action
      return true;
    }
  }

  /**
   * Returns whether this action is shown on a toolbar
   */
  get showOnToolbar(): boolean {
    return ['default', 'right'].includes(this.position);
  }

  /**
   * Returns whether this action is visible for the given set of breakpoints
   */
  showOn(activeBreakpoints: Set<Breakpoint>): boolean {
    return this.breakpoint == null || activeBreakpoints.has(this.breakpoint);
  }
}
