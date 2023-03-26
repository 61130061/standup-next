import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from "next/head";
import Link from 'next/link'

export default function CreateWorkspace ({ liff, liffError, idToken, devToken }) {
  const [name, setName] = useState('');
  const [time, setTime] = useState(["08:00", "08:30"]);
  const [days, setDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [questions, setQuestions] = useState(["What did you do since yesterday?", "What will you do today?"]);
  const [debug, setDebug] = useState(null);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(true);
  // TODO: Should I check if roomId is valide? 
  const router = useRouter();
  const { roomId } = router.query;

  const dayStr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const onSubmit = (e) => {
    e.preventDefault();
    setModal(true);

    const start = new Date();
    start.setHours(time[0].split(":")[0]);
    start.setMinutes(time[0].split(":")[1]);

    const stop = new Date();
    stop.setHours(time[1].split(":")[0]);
    stop.setMinutes(time[1].split(":")[1]);

    let token;
    if (!liff.isInClient()) token = devToken;
    else token = idToken;

    const body = {
      name,
      roomId,
      idToken: token,
      start,
      stop,
      days,
      questions
    }

    fetch('/api/workspace', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    }).then(res => {
      if (res.ok) {
        setLoading(false);
      } else {
        setModal(false);
        setDebug('Request not completed')
      }
    }).catch(err => {
      setModal(false);
      setDebug(err.toString());
      console.log(err);
    })
  }

  const onTimeUpdate = (e) => {
    let newTime = [...time];
    if (e.target.id == 'time-start') {
      newTime[0] = e.target.value;
    } else {
      newTime[1] = e.target.value;
    }

    setTime(newTime);
  }

  const onUpdateDay = (e) => {
    const newDay = [...days];
    if (newDay.includes(e.target.id)) {
      const index = newDay.indexOf(e.target.id);
      if (index > -1) newDay.splice(index, 1);
    } else {
      newDay.push(e.target.id);
    }

    setDays(newDay);
  }

  const onAddQuestion = () => {
    const ele = document.getElementById('new-question');
    const val = ele.value;
    if (ele.value != '') {
      setQuestions(prev => [...prev, val]);
      ele.value = '';
    }
  }

  const onDelQuestion = (index) => {
    questions.splice(index, 1);
    setQuestions(prev => [...prev]);
  }

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

      <main className="max-w-2xl p-3 mx-auto">
        {modal &&
          <div className="fixed top-0 left-0 z-50 w-full h-full overflow-hidden">
            <div className="relative h-full flex items-center justify-center bg-black bg-opacity-70">
              <div className="bg-white flex flex-col items-center max-w-lg gap-5 shadow-lg rounded-lg p-5">
                {loading ?
                  <div>loading...</div> :
                  <>
                    <div>
                      <svg className="text-green-400" width="100px" height="100px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21.5609 10.7386L20.2009 9.15859C19.9409 8.85859 19.7309 8.29859 19.7309 7.89859V6.19859C19.7309 5.13859 18.8609 4.26859 17.8009 4.26859H16.1009C15.7109 4.26859 15.1409 4.05859 14.8409 3.79859L13.2609 2.43859C12.5709 1.84859 11.4409 1.84859 10.7409 2.43859L9.17086 3.80859C8.87086 4.05859 8.30086 4.26859 7.91086 4.26859H6.18086C5.12086 4.26859 4.25086 5.13859 4.25086 6.19859V7.90859C4.25086 8.29859 4.04086 8.85859 3.79086 9.15859L2.44086 10.7486C1.86086 11.4386 1.86086 12.5586 2.44086 13.2486L3.79086 14.8386C4.04086 15.1386 4.25086 15.6986 4.25086 16.0886V17.7986C4.25086 18.8586 5.12086 19.7286 6.18086 19.7286H7.91086C8.30086 19.7286 8.87086 19.9386 9.17086 20.1986L10.7509 21.5586C11.4409 22.1486 12.5709 22.1486 13.2709 21.5586L14.8509 20.1986C15.1509 19.9386 15.7109 19.7286 16.1109 19.7286H17.8109C18.8709 19.7286 19.7409 18.8586 19.7409 17.7986V16.0986C19.7409 15.7086 19.9509 15.1386 20.2109 14.8386L21.5709 13.2586C22.1509 12.5686 22.1509 11.4286 21.5609 10.7386ZM16.1609 10.1086L11.3309 14.9386C11.1909 15.0786 11.0009 15.1586 10.8009 15.1586C10.6009 15.1586 10.4109 15.0786 10.2709 14.9386L7.85086 12.5186C7.56086 12.2286 7.56086 11.7486 7.85086 11.4586C8.14086 11.1686 8.62086 11.1686 8.91086 11.4586L10.8009 13.3486L15.1009 9.04859C15.3909 8.75859 15.8709 8.75859 16.1609 9.04859C16.4509 9.33859 16.4509 9.81859 16.1609 10.1086Z" fill="currentColor" />
                      </svg>
                    </div>
                    <div className="text-center mx-5">Workspace is successfully created! Check your workspace frome standup line chat.</div>
                    <Link href="/workspace">
                      <button className="px-3 py-2 text-white rounded-lg bg-indigo-500">back to workspace</button>
                    </Link>
                  </>
                }
              </div>
            </div>
          </div>
        }

        <Link href="/">
          <h1 className="my-5 text-center text-5xl font-bold text-indigo-500">Standup LIFF</h1>
        </Link>
        <h2 className="my-2 text-2xl font-bold">Create workspace</h2>
        <p className="text-sm font-light text-gray-600">Please enter all field below and remember that you can change this information any time after created a workspace.</p>
        <form onSubmit={onSubmit} id="create-workspace-form" className="flex flex-col gap-4 my-3">
          <label className="flex flex-col gap-1">
            Workspace Name
            <input onChange={(e) => setName(e.target.value)} value={name} id="name" className="border rounded px-2 py-1" placeholder="Project #101" required />
          </label>
          <div>
            <h3>Routine Schedule</h3>
            <p className="text-sm font-light text-gray-600">When to let your member do standup answer.</p>
            <div className="flex gap-2 my-1">
              <label className="flex-1 flex flex-col gap-1">
                Start
                <input id="time-start" value={time[0]} max={time[1] ? time[1] : "24:00"} onChange={onTimeUpdate} type="time" className="border rounded px-2 py-1" required />
              </label>
              <label className="flex-1 flex flex-col gap-1">
                Stop
                <input id="time-stop" value={time[1]} min={time[0] ? time[0] : "00:00"} onChange={onTimeUpdate} type="time" className="border rounded px-2 py-1" required />
              </label>
            </div>
            <div className="my-1">Day</div>
            <div className="flex flex-wrap gap-2">
              {dayStr.map((d, i) =>
                <div key={i} className="flex text-sm">
                  <input id={d} type="checkbox" checked={days.includes(d)} onChange={onUpdateDay} className="peer sr-only" />
                  <label htmlFor={d} className="border px-3 py-2 rounded-lg text-gray-500 peer-checked:text-indigo-600 peer-checked:border-indigo-600 hover:cursor-pointer">
                    {d}
                  </label>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <h3>Questions</h3>
            <p className="text-sm font-light text-gray-600">List of questions you would like members to answer follow the schedule.</p>
            <div className="flex items-center gap-3 my-1">
              <input id="new-question" className="flex-1 border rounded px-2 py-1" placeholder="How do you feel today?" />
              <button onClick={onAddQuestion} type="button" className="bg-indigo-500 text-white rounded-lg px-3 py-2">Add</button>
            </div>
            <div className="flex flex-col gap-1">
              {questions.map((d, i) =>
                <div key={i} className="flex items-center justify-between py-1 px-2 border rounded-lg">
                  <div>{d}</div>
                  <button onClick={() => onDelQuestion(i)} type="button" className="text-sm rounded hover:bg-slate-300 p-1">del</button>
                </div>
              )}
            </div>
          </div>
        </form>
        <button className="px-3 py-2 my-3 bg-indigo-500 rounded-lg text-white mr-5" form="create-workspace-form" type="submit">Create</button>
        <button className="px-3 py-2 my-3 rounded-lg mr-5">Cancel</button>
        <div>
          Debug: {debug && debug}
        </div>
      </main>
    </div>
  )
}