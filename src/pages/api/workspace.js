import prisma from '../../server/db';
import { decode } from 'jsonwebtoken';
const https = require('https');

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') { // create worksapce
      const { name, idToken, start, stop, days, questions } = req.body;

      if (!name || !idToken || !start || !stop || !days || !questions) {
        res.status(401).json({ error: "missing input" });
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

      res.status(200).send('success');
    } else if (req.method === 'PATCH') {
      // Update workspace
    } else if (req.method === 'DELETE') { // Delete workspace
      const deleteWorkspace = await prisma.workspace.deleteMany({
        where: {
          name: {
            contains: 'New Workspace'
          }
        }
      })

      res.status(200).send('Delete Success!');
    } else {
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
    res.status(500).send('server error');
  }
}