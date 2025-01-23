import { writeFile } from "fs";
import { create } from "@wppconnect-team/wppconnect"; //const wppconnect = require("@wppconnect-team/wppconnect");
import getChatGptResponse from "./api.js";

create({
  session: "Iniciar bot",
  catchQR: (base64Qr, asciiQR) => {
    console.log(asciiQR); // Optional to log the QR in the terminal
    var matches = base64Qr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
      response = {};

    if (matches.length !== 3) {
      return new Error("Invalid input string");
    }
    response.type = matches[1];
    response.data = new Buffer.from(matches[2], "base64");

    var imageBuffer = response;
    writeFile("out.png", imageBuffer["data"], "binary", function (err) {
      if (err != null) {
        console.log(err);
      }
    });
  },
  logQR: false,
})
  .then((client) => {
    console.log("Bot conectado ao whatsapp");

    client.onMessage(async (message) => {
      if (message.type === "chat") {
        console.log(`Mensagem recebida de ${message.from}: ${message.body}`);

        const response = await getChatGptResponse(message.body);
        await client.sendText(message.from, response);
      }
    });
  })

  .catch((error) => console.log(error));

// function start(client) {
//   //   client.onMessage((message) => {
//   //     if (message.body.toLowerCase() === "oi") {
//   //       client
//   //         .sendText(message.from, "ryanzin, como posso ajudar?")
//   //         .then((result) => {
//   //           console.log("Result: ", result); //return object success
//   //         })
//   //         .catch((erro) => {
//   //           console.error("Error when sending: ", erro); //return object error
//   //         });
//   //     }
//   //   });
//   // }
