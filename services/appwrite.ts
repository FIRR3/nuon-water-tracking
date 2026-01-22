import { Account, Client, Databases } from "appwrite";

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
const usersTableId = process.env.EXPO_PUBLIC_APPWRITE_TABLE_ID;

if (!endpoint || !projectId) {
  throw new Error(
    "Missing Appwrite endpoint or project ID in environment variables.",
  );
}

if (!databaseId || !usersTableId) {
  throw new Error(
    "Missing Appwrite database or table ID in environment variables.",
  );
}

const client = new Client();

client.setEndpoint(endpoint).setProject(projectId);

const account = new Account(client);
const databases = new Databases(client);

export {
  account,
  client,
  databases,
};

export const DATABASE_ID: string = databaseId;
export const USERS_TABLE_ID: string = usersTableId;