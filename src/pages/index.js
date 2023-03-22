import Head from "next/head";

export default function Home({ liff, liffError }) {

  if (!liff) {
    return (
      <div>Loading...</div>
    )
  }

  return (
    <div>
      <Head>
        <title>Standup LIFF</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container p-5 mx-auto">
        <h1 className="my-3 text-center text-5xl font-bold text-indigo-500">Standup LIFF</h1>
        <div className="my-3">
          {liff && <p>LIFF init succeeded</p>}
          {liffError && (
            <>
              <p>LIFF init failed</p>
              <p>
                <code>{liffError}</code>
              </p>
            </>
          )}
          <p>on {liff.isInClient() ? 'LIFF app browser' : 'external browser'}</p>
        </div>
        <button className="my-3 bg-blue-500 px-3 py-1 rounded text-white">Login</button>
      </main>
    </div>
  );
}
