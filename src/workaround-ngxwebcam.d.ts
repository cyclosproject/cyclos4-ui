// This is needed for ngx-webcam because MediaStreamError was removed from TypeScript 4.4.
// See https://github.com/basst314/ngx-webcam/issues/130
export { };

declare global {
  type MediaStreamError = Error;
}
