export type Chunk = {
  id: string;
  source: string;
  title: string;
  content: string;
};

export type RetrievedChunk = Chunk & {
  score: number;
};

export interface Retriever {
  /** Human readable name, used for logging/debugging. */
  readonly name: string;
  /** Retrieve the most relevant chunks for a free-text query. */
  retrieve(query: string, topK?: number): Promise<RetrievedChunk[]>;
}