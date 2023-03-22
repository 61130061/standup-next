import prisma from '../../server/db';
import { https } from 'https';
import { decode } from 'jsonwebtoken';

const CHANNEL_ID = '1660773288';

async function verifyToken(id_token) {
  return new Promise((resolve, reject) => {
    const strBody = JSON.stringify({
      id_token,
      client_id: CHANNEL_ID
    });

    const options = {
      hostname: 'api.line.me',
      path: '/oauth2/v2.1/verify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: strBody
    };

    const req = https.request(options, (res) => {
      let resChunks = [];

      res.on('data', (d) => {
        resChunks.push(d);
      });

      res.on('end', () => {
        console.log(JSON.parse(Buffer.concat(resChunks)));
        resolve(JSON.parse(Buffer.concat(resChunks)));
      })
    });

    req.on('error', (error) => {
      console.error(error);
      resolve(null);
    });

    req.write(strBody);
    req.end();
  })
}

export default async function handler(req, res) {
  if (req.method === 'POST') { // create worksapce
    const { name, idToken, start, stop, days, questions } = req.body;

    const tokenDecode = decode(idToken);
    console.log(tokenDecode);

    const response = await verifyToken(idToken);

    // const newWorkspace = await prisma.workspace.create({
    //   data: {
    //     name,
    //     userId: tokenDecode.sub,
    //   }
    // })

    res.status(200).json(response);
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
    // Handle any other HTTP method
    res.send('HTTP method');
  }
}