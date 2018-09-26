/**
 * Possible ways to render a value:
 *
 * - `plain`: A plain string
 * - `break`: A string whose new lines are rendered as line breaks
 * - `html`: A HTML-formatted string
 * - `widget`: The value is not a string, but another component
 */
export type ValueFormat = 'plain' | 'break' | 'html' | 'component';
