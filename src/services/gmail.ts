import { gapi } from 'gapi-script';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SCOPES = 'https://www.googleapis.com/auth/gmail.modify';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"];

let gapiInited = false;

export const GmailService = {
    initialize: () => {
        return new Promise<void>((resolve, reject) => {
            if (gapiInited) {
                resolve();
                return;
            }

            gapi.load('client:auth2', async () => {
                try {
                    await gapi.client.init({
                        apiKey: API_KEY || undefined,
                        clientId: CLIENT_ID,
                        discoveryDocs: DISCOVERY_DOCS,
                        scope: SCOPES,
                    });
                    gapiInited = true;
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    },

    signIn: async () => {
        if (!gapiInited) await GmailService.initialize();
        return (gapi as any).auth2.getAuthInstance().signIn();
    },

    signOut: async () => {
        if (!gapiInited) await GmailService.initialize();
        return (gapi as any).auth2.getAuthInstance().signOut();
    },

    isSignedIn: () => {
        return gapiInited && (gapi as any).auth2.getAuthInstance().isSignedIn.get();
    },

    getUserProfile: () => {
        if (!GmailService.isSignedIn()) return null;
        const user = (gapi as any).auth2.getAuthInstance().currentUser.get();
        return user.getBasicProfile();
    },

    listMessages: async (query: string = '') => {
        if (!GmailService.isSignedIn()) throw new Error('Not signed in');
        const response = await gapi.client.gmail.users.messages.list({
            'userId': 'me',
            'q': query,
            'maxResults': 20
        });
        return response.result.messages || [];
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
