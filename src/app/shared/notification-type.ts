/**
 * The possible types of notifications displayed to users
 */
export type NotificationType = 
  "info" |
  "warning" |
  "error";

export module NotificationType {
  export const INFO: NotificationType = "info";
  export const WARNING: NotificationType = "warning";
  export const ERROR: NotificationType = "error";
  export function values(): NotificationType[] {
    return [INFO, WARNING, ERROR];
  }
}
