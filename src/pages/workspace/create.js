import React, { useState } from 'react';
import Head from "next/head";

export default function CreateWorkspace ({ liff, liffError, idToken }) {
  const [name, setName] = useState('');
  const [time, setTime] = useState(["08:00", "08:30"]);
  const [days, setDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [questions, setQuestions] = useState(["What did you do since yesterday?", "What will you do today?"]);

  const dayStr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const onSubmit = (e) => {
    e.preventDefault();

    const start = new Date();
    start.setHours(time[0].split(":")[0]);
    start.setMinutes(time[0].split(":")[1]);

    const stop = new Date();
    stop.setHours(time[1].split(":")[0]);
    stop.setMinutes(time[1].split(":")[1]);

    const body = {
      name,
      idToken,
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
      aler(res.json());
    }).catch(err => {
      aler(err);
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
        <h1 className="my-5 text-center text-5xl font-bold text-indigo-500">Standup LIFF</h1>
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
      </main>
    </div>
  )
}