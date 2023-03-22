import prisma from '../../server/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // create workspace

    const input = {
      userId: 'xxx-xx-xxx-xxx-xxxx',
      name: 'Workspace 1'
    }

    const newWorkspace = await prisma.workspace.create({
      data: {
        name: 'New Workspace'
      }
    });

    res.status(200).send('Create Success!');
  } else if (req.method === 'DELETE') {
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