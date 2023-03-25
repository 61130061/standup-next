import prisma from '../../../server/db';
import { decode } from 'jsonwebtoken';

export default async function handler(req, res) {
  try {
    if (req.method == 'POST') { // response to workspace
      const { workspaceId, idToken, content } = req.body;

      const userData = decode(idToken);
      
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: { members: {
          where: { id: userData.sub }
        }},
      })

      if (!workspace) {
        res.status(401).send("WORKSPACE_NOT_FOUND");
        return
      }

      if (workspace.members.length == 0) {
        res.status(401).send("WRONG_WORKSPACE");
        return
      }

      const now = new Date();
      const startTime = new Date();
      const endTime = new Date();

      startTime.setHours(workspace.start.getHours());
      startTime.setMinutes(workspace.start.getMinutes());
      startTime.setSeconds(0);
      startTime.setMilliseconds(0);

      endTime.setHours(workspace.stop.getHours());
      endTime.setMinutes(workspace.stop.getMinutes());
      endTime.setSeconds(0);
      endTime.setMilliseconds(0);

      if (startTime > now || now > endTime) {
        res.status(401).send("LATE_SUBMIT");
        return
      }

      const response = await prisma.response.findFirst({
        where: {
          AND: [
            { userId: userData.sub },
            { createdAt: { gte: startTime, lt: endTime } }
          ]
        }
      });

      if (response) {
        res.status(401).send("ALREADY_HAVE_RESPONSE_TODAY");
        return
      }

      const newResponse = await prisma.response.create({
        data: {
          userId: userData.sub,
          workspaceId,
          content
        }
      })

      res.status(200).json({ data: newResponse });
    } else if (req.method == "DELETE") { // Remove response
      const { responseId, idToken } = req.body;

      const userData = decode(idToken);

      const response = await prisma.response.findUnique({
        where: {
          id: responseId
        }
      })

      if (!response) {
        res.status(401).send("RESPONSE_NOT_FOUND")
        return 
      }

      if (response.userId !== userData.sub) {
        res.status(401).send("UNAUTHORIZED")
        return
      }

      await prisma.response.delete({
        where: {
          id: responseId
        }
      })

      res.status(200).send("SUCCEED");
    } else if (req.method == "PATCH") { // Update response
      const { responseId, idToken, content } = req.body;

      const userData = decode(idToken);

      const isResponse = await prisma.response.findFirst({
        where: {
          AND: [
            { id: responseId } , // Response id
            { userId: userData.sub } // User id
          ]
        }
      });

      if (!isResponse) {
        res.status(401).send("RESPONSE_NOT_FOUND");
        return
      }

      const newResponse = await prisma.response.update({
        where: {
          id: responseId,
        },
        data: { content }
      })

      res.status(200).send(newResponse);
    } else {
      res.status(400).send("BAD_REQUEST");
    }
  } catch (err) {
    console.log(err);
    res.status(500).send('SERVER_ERROR');
  }
}