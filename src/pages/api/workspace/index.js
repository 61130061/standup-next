import { decode } from 'jsonwebtoken';
import { Client } from '@line/bot-sdk';

import prisma from '../../../server/db';
import { createSchedule, deSchedule } from '../../../server/schedule';
import { lineConfig, LIFF_URL } from '../../server/line.config';

const inviteFlex = (workspace) => {
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
          "text": "Start at time: " + workspace.start.toString(),
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

const client = new Client(lineConfig);

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

      if (newWorkspace.running) {
        const lowercaseDays = newWorkspace.days.map(day => day.toLowerCase());
        const cronStr = `${newWorkspace.start.getMinutes()} ${newWorkspace.start.getHours()} * * ${lowercaseDays.join(',')}`;

        createSchedule(newWorkspace, cronStr);
      } else {
        deSchedule(newWorkspace);
      }

      await client.pushMessage(newWorkspace.roomId, inviteFlex(newWorkspace));

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

      /* TODO:
      - is it better to check time update before create schedule?
      - right now every time workspace update, schedule will be recreate. (maybe bad for server)
      */
      if (newWorkspace.running) { // update from deactivate -> activate
        deSchedule(newWorkspace);
        const lowercaseDays = newWorkspace.days.map(day => day.toLowerCase());
        const cronStr = `${newWorkspace.start.getMinutes()} ${newWorkspace.start.getHours()} * * ${lowercaseDays.join(',')}`;

        createSchedule(newWorkspace, cronStr);
      } else { // update from activate -> deactivate
        deSchedule(newWorkspace);
      }

      res.status(200).json({ success: true, data: newWorkspace });
    } else if (req.method === 'DELETE') { // Delete workspace
      const deleteWorkspace = await prisma.workspace.deleteMany({
        where: {
          name: {
            contains: 'New Workspace'
          }
        }
      })

      res.status(200).send('Delete Success!');
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