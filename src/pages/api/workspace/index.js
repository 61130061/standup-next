import { decode } from 'jsonwebtoken';

import prisma from '../../../server/db';
import { LIFF_URL, client } from '../../../server/line';

const inviteFlex = (workspace) => {
  const hours = workspace.start.getHours();
  const minutes = workspace.start.getMinutes();

  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  return {
    "type": "bubble",
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": "CREATE COMPLETED",
          "weight": "bold",
          "color": "#1DB446",
          "size": "sm"
        },
        {
          "type": "text",
          "text": workspace.name,
          "weight": "bold",
          "size": "xxl",
          "margin": "md"
        },
        {
          "type": "text",
          "text": `${workspace.name} is now active, I will start sending DMs to members following setting below.`,
          "size": "md",
          "wrap": true
        },
        {
          "type": "separator",
          "margin": "lg"
        },
        {
          "type": "text",
          "text": "Start at time: " + timeString,
          "margin": "lg"
        },
        {
          "type": "separator",
          "margin": "lg"
        },
        {
          "type": "text",
          "text": "Click join button below to join as a member of this workspace.",
          "margin": "lg",
          "color": "#aaaaaa",
          "wrap": true,
          "size": "xs"
        },
        {
          "type": "separator",
          "margin": "lg"
        },
        {
          "type": "button",
          "action": {
            "type": "uri",
            "label": "Join workspace",
            "uri": LIFF_URL + '/workspace/join/' + workspace.id
          },
          "margin": "lg"
        }
      ]
    },
    "styles": {
      "footer": {
        "separator": true
      }
    }
  }
}

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') { // create worksapce
      const { name, roomId, idToken, start, stop, days, questions } = req.body;

      if (!name || !idToken || !start || !stop || !days || !questions || !roomId) {
        res.status(401).json({ error: "MISSING_INPUT" });
        return
      }

      const room = await prisma.chatroom.findUnique({
        where: { id: roomId }
      })

      if (!room) {
        res.status(401).json({ error: "CHATROOM_NOT_FOUND" });
        return
      }

      const decodedToken = decode(idToken);

      const newQuestions = questions.map((ele, i) => {
        return {
          name: ele,
          index: i
        }
      });

      const newWorkspace = await prisma.workspace.create({
        data: {
          name,
          userId: decodedToken.sub,
          Chatroom: {
            connect: { id: room.id }
          },
          start,
          stop,
          days,
          questions: {
            create: newQuestions
          }
        }
      })

      await client.pushMessage(newWorkspace.roomId, {
        "type": "flex",
        "altText": "invite to workspace flex message",
        "contents": inviteFlex(newWorkspace)
      });

      res.status(200).send('SUCCESS');
    } else if (req.method === 'PATCH') { // Update workspace
      const { workspaceId, idToken, content } = req.body;

      if (!workspaceId || !idToken || !content) {
        res.status(401).send("MESSING_INPUT");
        return 
      }

      const userData = decode(idToken);

      const workspace = await prisma.workspace.findFirst({
        where: {
          AND: [
            { id: workspaceId },
            { userId: userData.sub }
          ]
        }
      })

      if (!workspace) {
        res.status(401).send("WORKSPACE_NOT_FOUND");
        return
      }

      const newWorkspace = await prisma.workspace.update({
        where: {
          id: workspace.id
        },
        data: content
      });

      res.status(200).json({ success: true, data: newWorkspace });
    } else if (req.method === 'DELETE') { // Delete workspace
      const { idToken, workspaceId } = req.body;

      if (!idToken || !workspaceId) return res.status(401).json({ error: "MISS_INPUT" })

      const userData = decode(idToken);

      const delTransaction = await prisma.$transaction(async (tx) => {
        const workspace = await tx.workspace.findFirst({
          where: {
            AND: [{ id: workspaceId }, { userId: userData.sub }]
          },
          include: {
            Chatroom: {
              include: { workspaces: true }
            }
          }
        })

        if (!workspace) throw new Error("UNAUTHORIZED_ACCOUNT")

        await tx.response.deleteMany({
          where: { workspaceId: workspace.id }
        })

        await tx.user.deleteMany({
          where: { workspaceId: workspace.id }
        })

        await tx.question.deleteMany({
          where: { workspaceId: workspace.id }
        })

        const delWorkspace = await tx.workspace.delete({
          where: { id: workspace.id }
        })

        console.log(workspace.Chatroom);

        if (workspace.Chatroom.workspaces.length <= 1) {
          await tx.chatroom.delete({
            where: { id: workspace.Chatroom.id }
          })
        }

        return delWorkspace;
      })

      res.status(200).json({ success: true, result: delTransaction });
    } else { // GET Method
      const { userToken } = req.query;

      const idToken = decode(userToken);

      if (!idToken) {
        res.status(401).json({ error: "MISSING_INPUT" });
        return
      }

      const workspaces = await prisma.workspace.findMany({
        where: {
          userId: idToken.sub
        },
        orderBy: [
          {
            createdAt: 'desc'
          }
        ]
      })

      // Handle any other HTTP method
      res.status(200).json({ success: true, data: workspaces });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send('SERVER_ERROR');
  }
}