import { LogLevel, PublicClientApplication } from '@azure/msal-browser';

// Config object to be passed to Msal on creation
export const msalConfig = {
  auth: {
    clientId: '72c38d69-9c3a-43fb-8b47-9c93a0ef9fd3',
    redirectUri: 'https://pci.inf.santiago.usm.cl/', // Must be registered as a SPA redirectURI on your app registration
    postLogoutRedirectUri: 'https://pci.inf.santiago.usm.cl/' // Must be registered as a SPA redirectURI on your app registration
  },
  cache: {
    cacheLocation: 'sessionStorage'
  },
  system: {
      loggerOptions: {
          loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
              if (containsPii) {	
                  return;	
              }
              switch (level) {	
                  case LogLevel.Error:	
                      console.error(message);	
                      return;	
                  case LogLevel.Info:	
                      console.info(message);	
                      return;	
                  case LogLevel.Verbose:
                      console.debug(message);	
                      return;	
                  case LogLevel.Warning:	
                      console.warn(message);	
                      return;	
                  default:
                      return;
              }
          },
          logLevel: LogLevel.Verbose
      }
  }
};

export const msalInstance = new PublicClientApplication(msalConfig);

// Add here scopes for id token to be used at MS Identity Platform endpoints.
export const loginRequest = {
  scopes: ['User.Read'],
};

// Add here the endpoints for MS Graph API services you would like to use.
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
};
