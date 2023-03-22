import https from 'https';
import { Client, middleware, JSONParseError } from '@line/bot-sdk';

const TOKEN = process.env.LINE_ACCESS_TOKEN
const LIFF_URL = process.env.LINE_LIFF_URL 

const lineConfig = {
  channelAccessToken: TOKEN,
  channelSecret: process.env.LINE_SECRET
}

const standupMenu = {
  "type": "text",
  "text": "I'm here! What would you like me todo?",
  "quickReply": {
    "items": [
      {
        "type": "action",
        "action": {
          "type": "uri",
          "label": "Create workspace",
          "uri": LIFF_URL + "/workspace/create"
        }
      },
      {
        "type": "action",
        "action": {
          "type": "uri",
          "label": "Edit workspace",
          "uri": LIFF_URL + "/workspace/setting"
        }
      }
    ]
  }
}

const client = new Client(lineConfig);

export default async function handler(req, res) {
  const middlewareFunc = middleware(lineConfig);

  try {
    await middlewareFunc(req, res, () => {});
  } catch (err) {
    if (err instanceof JSONParseError) {
      console.error('Error: Invalid JSON', err);
      return res.status(400).send('Bad Request');
    }
    console.error(err);
    return res.status(500).send('Internal Server Error');
  }

  const questions = ['What did you do since yesterday?', 'What will you do today?']

  if (req.method === 'POST') {
    try {
      const events = req.body.events;

      for (const event of events) {
        if (event.type === 'message' && event.message.type === 'text') {
          switch (event.message.text) {
            case 'standup':
              await client.replyMessage(event.replyToken, standupMenu);
            default:
              // Send the first question to the user
              await client.replyMessage(event.replyToken, [
                {
                  type: 'text',
                  text: questions[0],
                }, {
                  type: 'text',
                  text: JSON.stringify(mockData),
                },
              ]);
          }
        }
      }

      res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}