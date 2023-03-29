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

const confirmAnswer = (res, qs) => {
  const contents = res.content.map((d, i) => ({
    "type": "box",
    "layout": "horizontal",
    "contents": [
      {
        "type": "box",
        "layout": "vertical",
        "contents": [],
        "width": "4px",
        "backgroundColor": "#c7d2fe"
      },
      {
        "type": "box",
        "layout": "vertical",
        "contents": [
          {
            "type": "text",
            "text": qs[i].name,
            "size": "sm",
            "weight": "bold",
            "wrap": true
          },
          {
            "type": "text",
            "text": d,
            "size": "sm",
            "wrap": true
          }
        ],
        "paddingTop": "xs",
        "paddingBottom": "xs"
      }
    ],
    "spacing": "md"
  }));

  return {
    "type": "bubble",
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "box",
          "layout": "horizontal",
          "contents": [
            {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "image",
                  "url": "https://scdn.line-apps.com/n/channel_devcenter/img/flexsnapshot/clip/clip13.jpg",
                  "aspectMode": "cover",
                  "size": "full"
                }
              ],
              "cornerRadius": "100px",
              "width": "72px",
              "height": "72px"
            },
            {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "Member name",
                  "size": "md",
                  "weight": "bold"
                },
                {
                  "type": "text",
                  "text": "workspace: name",
                  "size": "sm",
                  "color": "#bcbcbc"
                },
                {
                  "type": "text",
                  "text": "Date: 10 May 2022",
                  "size": "sm",
                  "color": "#bcbcbc",
                  "wrap": false
                }
              ],
              "paddingTop": "sm"
            }
          ],
          "spacing": "lg"
        },
        {
          "type": "box",
          "layout": "vertical",
          "contents": contents,
          "spacing": "md"
        },
        {
          "type": "box",
          "layout": "horizontal",
          "contents": [
            {
              "type": "button",
              "action": {
                "type": "postback",
                "label": "Confirm",
                data: JSON.stringify({
                  action: 'confirm_response',
                  result: true,
                  responseId: res.id
                })
              }
            },
            {
              "type": "button",
              "action": {
                "type": "postback",
                "label": "Reanswer",
                data: JSON.stringify({
                  action: 'confirm_response',
                  result: false,
                  responseId: res.id,
                  question: qs[0].name
                })
              }
            }
          ]
        }
      ],
      "paddingAll": "20px",
      "spacing": "xxl"
    }
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

            if (user && user.responses.length > 0) { // user is answering quesiton
              const workspace = await prisma.workspace.findUnique({
                where: { id: user.workspaceId },
                include: {
                  questions: {
                    orderBy: { index: "asc" }
                  }
                }
              });

              const content = [...user.responses[0].content];
              let newResponse;
              if (content.length < workspace.questions.length) {
                // answering question
                content.push(event.message.text);

                newResponse = await prisma.response.update({
                  where: { id: user.responses[0].id },
                  data: { content }
                })
              }

              if (content.length < workspace.questions.length && newResponse) {
                // reply next question
                await client.replyMessage(event.replyToken, {
                  type: 'text',
                  text: workspace.questions[content.length].name
                });
              } else {
                // TODO: send confirm submit flex message to API submit answer 
                await client.replyMessage(event.replyToken, {
                  "type": "flex",
                  "altText": "send confirm answer card!",
                  "contents": confirmAnswer(newResponse, workspace.questions)
                });
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
        } else if (event.type === 'postback') {
          const postbackData = event.postback.data;
          const parsedData = JSON.parse(postbackData);

          if (parsedData.action === 'confirm_response') {
            if (parsedData.result) {
              // confirm response
              console.log('confirm answer');

              const response = await prisma.response.findUnique({
                where: { id: parsedData.responseId },
                include: { Workspace: true }
              })

              if (!response) return res.status(401).send("RESPONSE_NOT_FOUND")

              const now = new Date();
              // Set late time as 5 hours after meeting as default
              const endTime = new Date(response.Workspace.lastMeeting.getTime() + 5 * 60 * 60 * 1000);

              if (now <= endTime) {
                await prisma.response.update({
                  where: { id: parsedData.responseId },
                  data: { submitAt: now }
                })
                await client.replyMessage(event.replyToken, {
                  type: 'text',
                  text: 'Your answer successfully is submitted to your boss!'
                });
              } else { // You are late
                await prisma.response.delete({
                  where: { id: parsedData.responseId }
                });
                await client.replyMessage(event.replyToken, {
                  type: 'text',
                  text: 'Submit not success because you are late.'
                });
              }
            } else {
              // reanswer
              console.log('reanswer');

              await prisma.response.update({
                where: { id: parsedData.responseId },
                data: { content: [] }
              })
              await client.replyMessage(event.replyToken, [
                {
                  type: 'text',
                  text: 'Please answer all questions again.'
                },
                {
                  type: 'text',
                  text: parsedData.question
                }
              ]);
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
