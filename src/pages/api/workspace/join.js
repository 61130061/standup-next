import { decode } from 'jsonwebtoken';

import prisma from '../../../server/db';

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') { // join workspace 
      const { workspaceId, idToken } = req.body;

      if (!idToken || !workspaceId) {
        res.status(401).json({ success: false, error: "MISSING_INPUT" });
        return
      }
      const userData = decode(idToken);

      /*
        TODO: add user isFriend detector using client.getProfile(userId)
      */

      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { members: { where: { id: userData.sub } } },
      });

      if (!workspace) {
        console.log("NOT_FRIEND")
        res.status(401).json({ error: "WORKSPACE_NOT_FOUND" });
        return
      }

      if (workspace.members.length > 0) {
        console.log("NOT_FRIEND")
        res.status(401).json({ error: "ALREADY_MEMBER" });
        return
      }

      const user = await prisma.user.upsert({
        where: { id: userData.sub },
        create: {
          id: userData.sub,
          Workspace: { connect: { id: workspaceId } }
        },
        update: {
          Workspace: { connect: { id: workspaceId } }
        }
      })

      res.status(200).json({ success: true, data: user });
    } else if (req.method === 'DELETE') { // Leave workspace
      const { workspaceId, idToken } = req.body;

      if (!idToken || !workspaceId) {
        res.status(401).json({ error: "MISSING_INPUT" });
        return
      }

      const userData = decode(idToken);

      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { members: { where: { id: userData.sub } } },
      });

      if (!workspace) {
        res.status(401).json({ error: "WORKSPACE_NOT_FOUND" });
        return
      }

      await prisma.workspace.update({
        where: {
          id: workspaceId
        },
        data: { members: { disconnect: { id: userData.sub } } },
      })

      res.status(200).json({ success: true });
    } else {
      res.status(200).send('METHOD_NOT_ALLOW');
    }
  } catch (err) {
    console.log(err);
    res.status(500).send('SERVER_ERROR');
  }
}