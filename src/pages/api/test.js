import prisma from '../../server/db';

export default async function handler(req, res) {
  const sourceId = 'test';
  const room = await prisma.room.upsert({
    where: {
      roomId: sourceId
    },
    create: {
      roomId: sourceId,
    },
    update: {
      roomId: sourceId,
    }
  });

  res.status(200).json(room);
}