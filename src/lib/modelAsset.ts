export function requireLocalModelUri(localUri: string | null | undefined): string {
  if (!localUri?.startsWith("file://")) {
    throw new Error("The bundled disease model was not materialized as a local file");
  }

  return localUri;
}
