import { Image } from 'app/api/models/image';

/**
 * Details of an OpenID connect client to be displayed in the consent page
 */
export interface OidcClient {
  id: string;
  name: string;
  internalName: string;
  description?: string;
  dynamic?: boolean;
  image?: Image;
  imageUrl?: string;
  domain?: string;
  privacyPolicyUrl?: string;
  termsOfServiceUrl?: string;
  website?: string;
}
