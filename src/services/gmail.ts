import { gapi } from 'gapi-script';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SCOPES = 'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"];

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

export const GmailService = {
    initialize: () => {
        return new Promise<void>((resolve, reject) => {
            if (gapiInited && gisInited) {
                resolve();
                return;
            }

            // Load GAPI client for API calls
            gapi.load('client', async () => {
                try {
                    await gapi.client.init({
                        apiKey: API_KEY || undefined,
                        discoveryDocs: DISCOVERY_DOCS,
                    });
                    gapiInited = true;

                    // Check for persisted token
                    const storedToken = localStorage.getItem('gmail_token');
                    if (storedToken) {
                        try {
                            const token = JSON.parse(storedToken);
                            // Simple check if token might be valid (not bulletproof without expiry check, but google handles invalid tokens gracefully usually)
                            gapi.client.setToken(token);
                        } catch (e) {
                            localStorage.removeItem('gmail_token');
                        }
                    }

                    if (gisInited) resolve();
                } catch (error) {
                    reject(error);
                }
            });

            // Init GIS Token Client
            try {
                tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    callback: (response: any) => {
                        if (response.error !== undefined) {
                            throw (response);
                        }
                    },
                });
                gisInited = true;
                if (gapiInited) resolve();
            } catch (err) {
                reject(err);
            }
        });
    },

    signIn: async () => {
        if (!gapiInited || !gisInited) await GmailService.initialize();

        return new Promise((resolve, reject) => {
            try {
                // Override callback to capture token
                tokenClient.callback = async (resp: any) => {
                    if (resp.error) {
                        reject(resp);
                        return;
                    }
                    // CRITICAL: Set the token for gapi.client
                    const token = {
                        access_token: resp.access_token,
                        expires_in: resp.expires_in,
                        scope: resp.scope,
                        token_type: resp.token_type
                        // other fields if needed
                    };
                    gapi.client.setToken(token);

                    // PERSIST TOKEN
                    localStorage.setItem('gmail_token', JSON.stringify(token));

                    resolve(resp);
                };

                // Request token (triggers popup)
                // Use prompt: '' to avoid forced prompt if already consented, but 'consent' is safer for testing
                tokenClient.requestAccessToken({ prompt: '' });
            } catch (err) {
                reject(err);
            }
        });
    },

    signOut: async () => {
        const token = gapi.client.getToken();
        if (token !== null) {
            (window as any).google.accounts.oauth2.revoke(token.access_token, () => { console.log('Revoked'); });
            gapi.client.setToken(null);
            localStorage.removeItem('gmail_token');
        }
    },

    isSignedIn: () => {
        return gapiInited && gapi.client.getToken() !== null;
    },

    getUserProfile: async () => {
        // GIS doesn't have a profile object like auth2. We fetch it manually via API.
        if (!GmailService.isSignedIn()) return null;
        try {
            const response = await gapi.client.gmail.users.getProfile({ userId: 'me' });
            return {
                getEmail: () => response.result.emailAddress,
                getName: () => response.result.emailAddress, // Setup minimal shim
                getImageUrl: () => '' // No avatar via this API easily without People API
            };
        } catch (e) {
            return null;
        }
    },

    listMessages: async (query: string = '') => {
        if (!GmailService.isSignedIn()) throw new Error('Not signed in');
        try {
            const response = await gapi.client.gmail.users.messages.list({
                'userId': 'me',
                'q': query,
                'maxResults': 20
            });
            return response.result.messages || [];
        } catch (err) {
            console.error("List Error", err);
            throw err;
        }
    },

    getMessage: async (id: string) => {
        const response = await gapi.client.gmail.users.messages.get({
            'userId': 'me',
            'id': id
        });
        return response.result;
    },

    // Helpler to parse headers
    getHeader: (message: any, name: string) => {
        const header = message.payload.headers.find((h: any) => h.name === name);
        return header ? header.value : '';
    },

    // Helper to decode body
    getBody: (message: any) => {
        let encodedBody = '';
        if (message.payload.parts) {
            encodedBody = message.payload.parts.find((part: any) => part.mimeType === 'text/plain')?.body.data || '';
        } else {
            encodedBody = message.payload.body.data || '';
        }
        return new TextDecoder().decode(Uint8Array.from(atob(encodedBody.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)));
    },

    sendEmail: async (to: string, subject: string, body: string) => {
        if (!GmailService.isSignedIn()) throw new Error('Not signed in');

        const emailLines = [
            `To: ${to}`,
            `Subject: ${subject}`,
            'Content-Type: text/plain; charset=utf-8',
            'MIME-Version: 1.0',
            '',
            body
        ];
        const email = emailLines.join('\r\n').trim();
        const base64EncodedEmail = btoa(unescape(encodeURIComponent(email))).replace(/\+/g, '-').replace(/\//g, '_');

        return gapi.client.gmail.users.messages.send({
            'userId': 'me',
            'resource': {
                'raw': base64EncodedEmail
            }
        });
    }
};
