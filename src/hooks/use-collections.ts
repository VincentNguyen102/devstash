"use client";

import { useEffect, useState } from "react";

export interface CollectionOption {
  id: string;
  name: string;
}

interface UseCollectionsResult {
  collections: CollectionOption[];
  loading: boolean;
  error: boolean;
}

/**
 * Fetches the signed-in user's collections from the user-scoped
 * `GET /api/collections` route. Client-only; server components use the
 * `lib/db` helpers instead.
 */
export function useCollections(): UseCollectionsResult {
  const [collections, setCollections] = useState<CollectionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    fetch("/api/collections")
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load collections");
        return response.json();
      })
      .then((body: { data?: CollectionOption[] }) => {
        if (!active) return;
        setCollections(body.data ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { collections, loading, error };
}
