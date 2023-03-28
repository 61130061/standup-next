import { decode } from 'jsonwebtoken';

import prisma from '../../../server/db';
import { client } from '../../../server/line';

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') { // Activate workspace
      const { workspaceId, idToken } = req.body;

      if (!idToken || !workspaceId) {
        res.status(401).json({ success: false, error: "MISSING_INPUT" });
        return
      }

      const userData = decode(idToken);
      const today = new Date();

      const workspace = await prisma.workspace.findFirst({
        where: {
          AND: [
            { id: workspaceId },
            { userId: userData.sub },
            {
              OR: [
                { lastMeeting: { lt: today } },
                { lastMeeting: null }
              ]
            }
          ]
        },
        include: {
          members: true,
          questions: { orderBy: { index: "asc" } }
        }
      })

      if (!workspace) {
        res.status(401).json({ success: false, error: "WORKSPACE_NOT_FOUND" });
        return
      }

      const updatedWorkspace = await prisma.workspace.update({
        where: { id: workspace.id },
        data: { lastMeeting: today }
      });

      const members = workspace.members.map(d => d.id);

      if (members.length > 0) {
        const responses = members.map(d => ({
          content: [],
          User: {
            connect: { id: d }
          },
          Workspace: {
            connect: { id: workspace.id }
          }
        }));

        await prisma.response.createMany({ data: responses, skipDuplicates: true  });

        await client.multicast(members, [
          {
            type: 'text',
            text: "You boss have start the meeting please answer question below",
          },
          {
            type: 'text',
            text: workspace.questions[0].name,
          }
        ]);
      }

      res.status(200).json({ success: true, data: updatedWorkspace});
    } else if (req.method === 'GET') { // Get standup response detail
      res.status(401).send('METHOD_NOT_ALLOW');
    } else {
      res.status(401).send('METHOD_NOT_ALLOW');
    }
  } catch (err) {
    console.log(err);
    res.status(500).send('SERVER_ERROR');
  }
}