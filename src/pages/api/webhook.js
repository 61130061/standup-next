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
const talkingUsers = [];

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
  const responses = [];

  if (req.method === 'POST') {
    try {
      const events = req.body.events;

      for (const event of events) {
        if (event.type === 'message' && event.message.type === 'text' && !talkingUsers.includes(event.source.userId)) {
          talkingUsers.push(event.source.userId)

          switch (event.message.text) {
            case 'standup':
              await client.replyMessage(event.replyToken, standupMenu);
            default:
              for (let i = 0; i < questions.length - 1; i++) {
                // Send the a question to the user
                await client.replyMessage(event.replyToken, {
                  type: 'text',
                  text: questions[i],
                });

                // Wait for the user's response
                const response = await waitForUserResponse(event.source.userId);

                if (index < questions.length) {
                  // Collect response and
                  responses.push(response);
                } else {
                  // Thank for response
                  await client.replyMessage(event.replyToken, [
                    {
                      type: 'text',
                      text: 'Thank you for your answer!!',
                    },
                    {
                      type: 'text',
                      text: JSON.stringify(responses),
                    },
                  ]);
                }
              }
          }

          const index = talkingUsers.indexOf(event.source.userId);
          if (index > -1) {
            talkingUsers.splice(index, 1);
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

async function waitForUserResponse(userId) {
  return new Promise((resolve, reject) => {
    setInterval(async () => {
      const messages = await client.getMessageContent(userId);
      if (messages.length > 0) {
        const message = messages[messages.length - 1];
        if (message.type === 'text') {
          clearInterval(interval);
          resolve(message.text);
        }
      }
    }, 1000);
  });
}