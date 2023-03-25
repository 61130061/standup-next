import prisma from '../../../server/db';
import { decode } from 'jsonwebtoken';

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') { // join workspace 
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

      if (workspace.members.length > 0) {
        res.status(401).json({ error: "ALREADY_MEMBER" });
        return
      }

      let user = await prisma.user.findUnique({
        where: {
          id: userData.sub
        }
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            id: userData.sub
          }
        });
      }

      const updatedWorkspace = await prisma.workspace.update({
        where: {
          id: workspaceId
        },
        data: {
          members: {
            connect: { id: userData.sub }
          }
        }
      })

      res.status(200).json({ data: updatedWorkspace });
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