import { Client } from '@line/bot-sdk';

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

              // TODO: Check if this is a good idea?
              const room = await prisma.chatroom.upsert({
                where: {
                  roomId: sourceId
                },
                create: {
                  roomId: sourceId,
                },
                update: {
                  roomId: sourceId,
                }
              });

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