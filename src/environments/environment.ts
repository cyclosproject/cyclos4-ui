import { isDevServer } from 'app/shared/helper';

export const environment = {
  // This is the environment for development
  production: false,


  // On development we're always standalone, that means, never switch to classic frontend
  standalone: true,

  // The API path / URL when in standalone mode
  apiUrl: '/api'
};

// When runnng on dev server, always consider standalone to be true
if (isDevServer()) {
  environment.standalone = true;
}