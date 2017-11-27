import { PrincipalTypeInput } from 'app/api/models';

/**
 * Represents an user identification method, which could either be an object
 * representing autocomplete, contacts or a principal
 */
export type IdMethod = {
  internalName: string,
  name: string
} | PrincipalTypeInput;