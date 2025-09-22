import { useAppConfig } from '@state';

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  'not-before-policy': number;
  scope: string;
}

export class TokenService {
  private static instance: TokenService;
  private oidcConfig: any;

  private constructor() {
    // This will be initialized when first used
  }

  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  public initialize(oidcConfig: any) {
    this.oidcConfig = oidcConfig;
  }

  public async generateAccessToken(): Promise<string> {
    if (!this.oidcConfig || !this.oidcConfig[0]) {
      throw new Error('OIDC configuration not available');
    }

    const config = this.oidcConfig[0];
    const clientId = config.client_id;
    const clientSecret = config.client_secret;
    const authority = config.authority;

    if (!clientId || !clientSecret || !authority) {
      throw new Error('Missing required OIDC configuration (client_id, client_secret, authority)');
    }

    const tokenUrl = `${authority}/protocol/openid-connect/token`;

    const formData = new URLSearchParams();
    formData.append('grant_type', 'client_credentials');
    formData.append('client_id', clientId);
    formData.append('client_secret', clientSecret);
    formData.append('scope', 'profile email');

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Token generation failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const tokenData: TokenResponse = await response.json();
      return tokenData.access_token;
    } catch (error) {
      console.error('Error generating access token:', error);
      throw error;
    }
  }

  public async generateStudyShareUrl(studyInstanceUid: string): Promise<string> {
    try {
      const accessToken = await this.generateAccessToken();
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/viewer?StudyInstanceUIDs=${studyInstanceUid}&token=${accessToken}`;
      return shareUrl;
    } catch (error) {
      console.error('Error generating study share URL:', error);
      throw error;
    }
  }
}

export default TokenService;
