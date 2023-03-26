import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from "next/head";
import Link from 'next/link'

export default function ActivateWorkspace ({ liff, liffError, idToken, devToken }) {
  const [loading, setLoading] = useState(true);
  const [debug, setDebug] = useState('Loading...');

  const router = useRouter();
  const { workspaceId } = router.query;

  useEffect(() => {
    if (liff) {
      let token;
      if (!liff.isInClient()) token = devToken;
      else token = idToken;

      const body = {
        idToken: token,
        workspaceId
      }

      fetch('/api/workspace/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      }).then(res => res.json())
        .then(res => {
          if (res.success) {
            setLoading(false);
          } else {
            console.log(res.error);
            setDebug("Something wrong! Please try again later.");
          }
        }).catch(err => {
          console.log(err);
          setDebug("Something wrong! Please try again later.");
        })
    }
  }, [liff])

  return (
    <div>
      <Head>
        <title>Join Workspace - Standup LIFF</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {loading ?
        <main className="max-w-2xl p-3 mx-auto flex flex-col gap-5 items-center justify-center h-screen">
          <div>{debug}</div>
          {debug !== "Loading..." &&
            <button onClick={() => liff.closeWindow()} className="px-3 py-2 rounded-lg bg-indigo-500 text-white">Close window</button>
          }
        </main>:
        <main className="max-w-2xl p-3 mx-auto flex flex-col gap-5 items-center justify-center h-screen">
          <div>Activate workspace completed!</div>
          <button onClick={() => liff.closeWindow()} className="px-3 py-2 rounded-lg bg-indigo-500 text-white">Close window</button>
        </main>
      }
    </div>
  )
}