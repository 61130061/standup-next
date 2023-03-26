import { decode } from 'jsonwebtoken';

import prisma from '../../../server/db';
import { client, middleware } from '../../../server/line';

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') { // Activate workspace
      const { workspaceId, idToken } = req.body;

      if (!idToken || !workspaceId) {
        res.status(401).json({ success: false, error: "MISSING_INPUT" });
        return
      }

      const userData = decode(idToken);

      const workspace = await prisma.workspace.findFirst({
        where: {
          AND: [{ id: workspaceId }, { userId: userData.sub }]
        },
        include: {
          members: true
        }
      })

      if (!workspace) {
        res.status(401).json({ success: false, error: "WORKSPACE_NOT_FOUND" });
        return
      }

      await middleware(req, res, async () => {
        const members = workspace.members.map(d => d.id);

        await client.pushMessage(members[0], {
          type: 'text',
          text: "Let's standup yall!",
        });
      });

      res.status(200).json({ success: true });
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