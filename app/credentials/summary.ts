import type { PublicCredential } from "./data";

export type CredentialSummary = {
  count: number;
  items: Array<Pick<PublicCredential, "id" | "title" | "issuer" | "issuer_logo_url" | "credential_url">>;
};

export function summarizeCredentials(credentials: PublicCredential[]): CredentialSummary {
  return {
    count: credentials.length,
    items: credentials
      .slice(0, 3)
      .map(({ id, title, issuer, issuer_logo_url, credential_url }) => ({
        id,
        title,
        issuer,
        issuer_logo_url,
        credential_url,
      })),
  };
}
