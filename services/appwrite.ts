import { Account, Client, Databases } from "appwrite";

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;

const usersTableId = process.env.EXPO_PUBLIC_APPWRITE_USERS_TABLE_ID;
const userHealthProfilesTableId =
  process.env.EXPO_PUBLIC_APPWRITE_USER_HEALTH_PROFILES_TABLE_ID;
const waterIntakeLogsTableId =
  process.env.EXPO_PUBLIC_APPWRITE_WATER_INTAKE_LOGS_TABLE_ID;
const dailySummariesTableId =
  process.env.EXPO_PUBLIC_APPWRITE_DAILY_SUMMARIES_TABLE_ID;

if (!usersTableId) {
  throw new Error("Missing Appwrite users table ID in environment variables.");
}
if (!userHealthProfilesTableId) {
  throw new Error(
    "Missing Appwrite user health profiles table ID in environment variables.",
  );
}
if (!waterIntakeLogsTableId) {
  throw new Error(
    "Missing Appwrite water intake logs table ID in environment variables.",
  );
}
if (!dailySummariesTableId) {
  throw new Error(
    "Missing Appwrite daily summaries table ID in environment variables.",
  );
}

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

export { account, client, databases };

export const DATABASE_ID: string = databaseId as string;
export const USERS_TABLE_ID: string = usersTableId as string;
export const USER_HEALTH_PROFILES_TABLE_ID: string =
  userHealthProfilesTableId as string;
export const WATER_INTAKE_LOGS_TABLE_ID: string =
  waterIntakeLogsTableId as string;
export const DAILY_SUMMARIES_TABLE_ID: string = dailySummariesTableId as string;
