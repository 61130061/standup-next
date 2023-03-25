import React, { useEffect, useState } from 'react';
import Head from "next/head";
import Link from 'next/link'

export default function Workspace ({ liff, liffError, idToken }) {
  const [workspaces, setWorkspaces] = useState([]);

  useEffect(() => {
    if (liff) {
      let token;
      if (!liff.isInClient()) token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2FjY2Vzcy5saW5lLm1lIiwic3ViIjoiVTEyMzQ1Njc4OTBhYmNkZWYxMjM0NTY3ODkwYWJjZGVmICIsImF1ZCI6IjEyMzQ1Njc4OTAiLCJleHAiOjE1MDQxNjkwOTIsImlhdCI6MTUwNDI2MzY1Nywibm9uY2UiOiIwOTg3NjU0YXNkZiIsImFtciI6WyJwd2QiXSwibmFtZSI6IlRhcm8gTGluZSIsInBpY3R1cmUiOiJodHRwczovL3NhbXBsZV9saW5lLm1lL2FCY2RlZmcxMjM0NTYifQ.ZWq-gAvJoxdt9BU9xIcaLP5ZzyDjqO9mMTkKmVraRLo';
      else token = idToken;

      fetch('/api/workspace?' + new URLSearchParams({ userToken: token }))
        .then(res => res.json())
        .then(data => {
          setWorkspaces(data.data);
          console.log(data);
        })
    }
  }, [liff]);

  if (!liff) {
    return (
      <div>Loading...</div>
    )
  }

  return (
    <div>
      <Head>
        <title>Workspace - Standup LIFF</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="max-w-2xl p-3 mx-auto">
        <Link href="/">
          <h1 className="my-5 text-center text-5xl font-bold text-indigo-500">Standup LIFF</h1>
        </Link>
        <div className="flex justify-between my-2">
          <h2 className="text-2xl font-bold">Your workspaces</h2>
          <Link href="workspace/create">
            <button className="px-3 py-2 text-white text-sm bg-indigo-500 rounded-lg">+ create workspace</button>
          </Link>
        </div>
        <p className="text-sm font-light text-gray-600">List of your workspaces.</p>
        <div className="my-5">
          {workspaces.length == 0 ?
            <div className="text-center my-5">no workspaces found</div> :
            workspaces.map((d, i) =>
              <div key={i} className="border rounded-lg p-3 my-3">
                <h3 className="text-lg mb-2 font-semibold">{d.name}</h3>
                <div className="flex justify-between items-end">
                  <div>
                    status:
                    <span className={d.running ? "text-green-500" : "text-red-500"}> {d.runnging ? "active" : "not active"}</span>
                  </div>
                  <div>start: 08:00, end: 09:00</div>
                </div>
              </div>
            )}
        </div>
      </main>
    </div>
  )
}