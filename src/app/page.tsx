export default function Home() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-semibold">SF Bay Water Quality Explorer</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Explore recent water measurements from San Francisco Bay monitoring stations,
        with plain-language explanations.
      </p>
      <p className="mt-2 text-sm text-zinc-500">
        This site is for education and exploration. It does not say whether water is
        safe for drinking, swimming, or fishing.
      </p>
    </main>
  );
}