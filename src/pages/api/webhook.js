import prisma from '../../server/db';
import { client, LIFF_URL } from '../../server/line';

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
        },
        {
          "type": "action",
          "action": {
            "type": "uri",
            "label": "Delete workspace",
            "uri": LIFF_URL + "/workspace/delete"
          }
        }
      ]
    }
  }
}

const headerMenu = (workspaces) => {
  const items = workspaces.map((d) => {
    return {
      "type": "action",
      "action": {
        "type": "uri",
        "label": d.name,
        "uri": LIFF_URL + "/workspace/activate/" + d.id
      }
    }
  })

  return {
    "type": "text",
    "text": "Here is your workspaces! Click to activate now.",
    "quickReply": { items }
  }
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const events = req.body.events;

      for (const event of events) {
        if (event.type === 'message' && event.message.type === 'text') {
          if (event.source.type === 'user') { // individual chat
            const today = new Date();

            const user = await prisma.user.findUnique({
              where: { id: event.source.userId },
              include: {
                responses: {
                  where: {
                    createdAt: {
                      gte: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0),
                      lt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59),
                    },
                    submitAt: null
                  },
                  orderBy: { createdAt: "desc" },
                  take: 1
                }
              }
            });

            if (user.responses.length > 0) { // user is answering quesiton
              const workspace = await prisma.workspace.findUnique({
                where: { id: user.workspaceId },
                include: {
                  questions: {
                    orderBy: { index: "asc" }
                  }
                }
              });

              const content = [...user.responses[0].content];
              if (content.length < workspace.questions.length) {
                // answering question
                content.push(event.message.text);

                await prisma.response.update({
                  where: { id: user.responses[0].id },
                  data: { content }
                })
              }

              if (content.length < workspace.questions.length) {
                // reply next question
                await client.replyMessage(event.replyToken, {
                  type: 'text',
                  text: workspace.questions[content.length]
                });
              } else {
                // TODO: send confirm submit flex message to API submit answer 
                console.log(content);
              }
            } else { // user not answering questions
              if (event.message.text.toLowerCase() == "standup") {
                const workspaces = await prisma.workspace.findMany({
                  where: { userId: event.source.userId }
                })

                if (workspaces.length > 0) {
                  await client.replyMessage(event.replyToken, headerMenu(workspaces));
                } else {
                  await client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: 'You have no workspace!'
                  });
                }
              }
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