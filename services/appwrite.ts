import { Client } from 'appwrite';

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;

if (!endpoint || !projectId) {
  throw new Error('Missing Appwrite endpoint or project ID in environment variables.');
}

const client = new Client();

client
  .setEndpoint(endpoint)
  .setProject(projectId);

export { client };