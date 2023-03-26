import { sign } from 'jsonwebtoken';
import { Client, middleware, JSONParseError } from '@line/bot-sdk';

import { lineConfig, LIFF_URL } from '../../server/line.config';
import prisma from '../../server/db';

const standupMenu = (roomId) => {
  return {
    "type": "text",
    "text": "I'm here! What would you like me todo?",
    "quickReply": {
      "items": [
        {
          "type": "action",
          "action": {
            "type": "uri",
            "label": "Workspace",
            "uri": LIFF_URL + "/workspace"
          }
        },
        {
          "type": "action",
          "action": {
            "type": "uri",
            "label": "Create workspace",
            "uri": LIFF_URL + "/workspace/create/" + roomId
          }
        }

      ]
    }
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

  if (req.method === 'POST') {
    try {
      const events = req.body.events;

      for (const event of events) {
        if (event.type === 'message' && event.message.type === 'text') {
          if (event.source.type === 'user') { // individual chat
            switch (event.message.text) {
              case 'standup':
                await client.replyMessage(event.replyToken, standupMenu);
              default:
                await client.replyMessage(event.replyToken, [
                  {
                    type: 'text',
                    text: "Hello! Let's standup for a bit.",
                  }
                ]);
            }
          } else { // group/multi-person chat
            if (event.message.text.toLowerCase() === 'standup') {
              let sourceId;
              if (event.source.groupId) sourceId = event.source.groupId
              else sourceId = event.source.roomId

              console.log(sourceId);

              // TODO: Check if this is a good idea?
              let room = await prisma.chatroom.findUnique({
                where: {
                  roomId: sourceId
                }
              });

              if (!room) {
                room = await prisma.chatroom.create({
                  data: { roomId: sourceId }
                })
              }

              await client.replyMessage(event.replyToken, standupMenu(room.id));
            } 
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