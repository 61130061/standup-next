import React, { useEffect, useState } from 'react';
import Head from "next/head";
import Link from 'next/link'

export default function DeleteWorkspace ({ liff, liffError, idToken, devToken }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [debug, setDebug] = useState('Loading...');

  useEffect(() => {
    if (liff) {
      let token;
      if (!liff.isInClient()) token = devToken;
      else token = idToken;

      fetch('/api/workspace?' + new URLSearchParams({ userToken: token }))
        .then(res => res.json())
        .then(data => {
          setWorkspaces(data.data);
          setLoading(false);
          console.log(data);
        })
    }
  }, [liff, idToken, devToken]);

  function getStrHnM(timeString) {
    const date = new Date(timeString);

    const h = date.getHours();
    const m = date.getMinutes();

    return [h.toString().padStart(2, '0'), m.toString().padStart(2, '0')];
  }

  const onDelete = (workspace) => {
    if (confirm("Are you sure to delete " + workspace.name) == true) {
      setLoading(true);
      let token;
      if (!liff.isInClient()) token = devToken;
      else token = idToken;

      const body = {
        idToken: token,
        workspaceId: workspace.id
      }

      fetch('/api/workspace', {
        method: 'DELETE',
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
            if (res.error == "ALREADY_MEMBER") {
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
  }

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

      {loading ?
        <main className="max-w-2xl p-3 mx-auto flex flex-col gap-5 items-center justify-center h-screen">
          <div>{debug}</div>
          {debug !== "Loading..." &&
            <button onClick={() => liff.closeWindow()} className="px-3 py-2 rounded-lg bg-indigo-500 text-white">Close window</button>
          }
        </main> :
        <main className="max-w-2xl p-3 mx-auto">
          <Link href="/">
            <h1 className="my-5 text-center text-5xl font-bold text-indigo-500">Standup LIFF</h1>
          </Link>
          <div className="flex justify-between my-2">
            <h2 className="text-2xl font-bold">Your workspaces</h2>
          </div>
          <p className="text-sm font-light text-gray-600">Click workspace you would like to delete</p>
          <div className="my-5">
            {workspaces.length == 0 ?
              <div className="text-center my-5">no workspaces found</div> :
              workspaces.map((d, i) =>
                <div onClick={() => onDelete(d)} className="border rounded-lg p-3 my-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg mb-2 font-semibold">{d.name}</h3>

                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      status:
                      <span className={d.running ? "text-green-500" : "text-red-500"}> {d.running ? "active" : "not active"}</span>
                    </div>
                    <div>start: {getStrHnM(d.start)[0]}:{getStrHnM(d.start)[1]}, end: {getStrHnM(d.stop)[0]}:{getStrHnM(d.stop)[1]}</div>
                  </div>
                </div>
              )}
          </div>
        </main>
      }
    </div>
  )
}