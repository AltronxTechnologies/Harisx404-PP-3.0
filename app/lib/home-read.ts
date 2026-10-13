export type HomeRead<T> = { value: T; available: boolean };

// Bound optional homepage work without caching the fallback as published data.
export async function homeRead<T>(name: string, read: () => Promise<T>, fallback: T, ms = 4000): Promise<HomeRead<T>> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return {
      value: await Promise.race([
        Promise.resolve().then(read),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error("deadline exceeded")), ms);
        }),
      ]),
      available: true,
    };
  } catch {
    console.error(`Home ${name} read failed or exceeded its deadline`);
    return { value: fallback, available: false };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
