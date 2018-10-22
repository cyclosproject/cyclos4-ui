/**
 * A custom action descriptor
 */
export class Action {
  constructor(
    public label: string,
    public onClick: () => void
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
    onClick: () => void
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
  constructor(
    icon: string,
    label: string,
    onClick: () => void,
    public maybeRoot = false
  ) {
    super(icon, label, onClick);
  }
}
