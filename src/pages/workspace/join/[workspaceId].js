import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from "next/head";
import Link from 'next/link'

export default function Join ({ liff, liffError, idToken, devToken }) {
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

      fetch('/api/workspace/join', {
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
            if (res.error == "NOT_FRIEND") {
              // tell them you add line account
              setDebug("You have not add Standup as you friend! Please add Standup first and then come back again.");
            } else if (res.error == "ALREADY_MEMBER") {
              setDebug("You already member of this workspace. Stay tune for your standup!");
            } else {
              // something wrong
              setDebug("Something wrong! Please try again later.");
            }
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
        <main className="max-w-2xl p-3 mx-auto flex items-center justify-center h-screen">
          <div>{debug}</div>
        </main>:
        <main className="max-w-2xl p-3 mx-auto">
          web page
        </main>
      }
    </div>
  )
}