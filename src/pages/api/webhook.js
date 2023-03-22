import https from 'https';

const TOKEN = process.env.LINE_ACCESS_TOKEN

export default function handler(req, res) {

  function reply(replyToken, messages) {
    const payload = JSON.stringify({
      replyToken,
      messages
    });
    // Request header
    const headers = {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + TOKEN
    }
    // Options to pass into the request
    const webhookOptions = {
      "hostname": "api.line.me",
      "path": "/v2/bot/message/reply",
      "method": "POST",
      "headers": headers,
      "body": payload
    }
    // Define request
    const request = https.request(webhookOptions, (https_res) => {
      https_res.on("data", (d) => {
        // get data
      })
    })
    // Handle error
    request.on("error", (err) => {
      console.error(err)
    })
    // Send data
    request.write(payload)
    request.end()
  }

  if (req.method === 'POST') {
    if (req.body.events.length === 0) {
      console.log('recieve line webhook verify');
      res.send("Send something to webhook URL!");
    } else {
      const event = req.body.events[0];

      if (event.type === "message") {
        console.log('recieve message from user');

        if (event.message.text === "standup") {
          reply(event.replyToken, [
            {
              "type": "text",
              "text": "I'm here! What would you like me todo?",
              "quickReply": {
                "items": [
                  {
                    "type": "action",
                    "action": {
                      "type": "uri",
                      "label": "Create workspace",
                      "uri": "https://liff.line.me/1660767408-j9VPQVOv/workspace/create"
                    }
                  },
                  {
                    "type": "action",
                    "action": {
                      "type": "uri",
                      "label": "Create workspace",
                      "uri": "https://liff.line.me/1660767408-j9VPQVOv/workspace/setting"
                    }
                  }
                ]
              }
            }
          ]);
        } else {
          reply(event.replyToken, [
            {
              "type": "text",
              "text": "Hello sir, nice to meet you."
            }
          ]);
        }
      }

      res.status(200).send('Success!');
    }
  } else {
    res.status(200).send('hello from api');
  }
}