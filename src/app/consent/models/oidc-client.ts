import { Image } from 'app/api/models/image';

/**
 * Details of an OpenID connect client to be displayed in the consent page
 */
export interface OidcClient {
  id: string;
  name: string;
  internalName: string;
  description?: string;
  image?: Image;
  privacyPolicyUrl?: string;
  termsOfServiceUrl?: string;
  website?: string;
}
