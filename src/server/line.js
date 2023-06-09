import * as Line from '@line/bot-sdk';

export const LIFF_URL = process.env.LINE_LIFF_URL 

const lineConfig = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_SECRET
}

export const client = new Line.Client(lineConfig);

const middlewareClient = Line.middleware(lineConfig);

export const middleware = async (req, res, callback) => {
  try {
    await middlewareClient(req, res, callback);
  } catch (err) {
    if (err instanceof Line.JSONParseError) {
      console.error('Error: Invalid JSON', err);
      return res.status(400).send('Bad Request');
    }
    console.error(err);
    return res.status(500).send('Internal Server Error');
  }
}