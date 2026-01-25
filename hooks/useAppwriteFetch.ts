import { useCallback, useEffect, useState } from "react";
import { DATABASE_ID, databases } from "../services/appwrite";

export function useAppwriteFetch<T = any>(
  collectionId: string,
  queries?: any[],
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        collectionId,
        queries ?? [],
      );
      setData(response.documents);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [collectionId, JSON.stringify(queries)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
