import { decode } from 'jsonwebtoken';

import prisma from '../../../server/db';
import { createSchedule, deSchedule } from '../../../server/schedule';

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') { // create worksapce
      const { name, idToken, start, stop, days, questions } = req.body;

      if (!name || !idToken || !start || !stop || !days || !questions) {
        res.status(401).json({ error: "MISSING_INPUT" });
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