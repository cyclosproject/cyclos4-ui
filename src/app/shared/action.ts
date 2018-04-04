/**
 * A custom action descriptor
 */
export class Action {
  constructor(
    public icon: string,
    public label: string,
    public onClick: () => void
  ) {
  }
}
