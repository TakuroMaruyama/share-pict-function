const { addFirestore } = require("./commons/firebase-content");
const line = require("@line/bot-sdk");
const cloudnary = require("cloudinary").v2;
const fs = require("fs");
const config = JSON.parse(fs.readFileSync("./config/config.json", "utf8"));

exports.handler = async (event) => {
  const client = new line.Client({
    channelAccessToken: config.CHANNEL_ACCESS_TOKEN,
    channelSecret: config.CHANNEL_SECRET,
  });
  const bodyJson = JSON.parse(event.body);

  //レスポンスは適当に返す
  const response = {
    statusCode: 200,
    body: JSON.stringify("hello"),
  };
  console.log("Proc Start");
  console.log(bodyJson.events[0]);

  let userName;
  let userId;

  await client
    .getProfile(bodyJson.events[0].source.userId)
    .then((profile) => {
      console.log(profile);
      console.log(bodyJson);
      userName = profile.displayName;
      userId = profile.userId;
      // message以外不要
      if (bodyJson.events[0].type === "message") {
        //写真だけ取得したいからimage以外不要
        if (bodyJson.events[0].message.type === "image") {
          return new Promise(() => {
            let chunkData = [];
            client
              .getMessageContent(bodyJson.events[0].message.id)
              .then((stream) => {
                return new Promise((resolve, reject) => {
                  stream.on("data", (chunk) => {
                    chunkData.push(Buffer.from(chunk));
                  });
                  stream.on("error", (err) => {
                    console.log(`stream error : ${err}`);
                    reject();
                  });
                  stream.on("end", (chunk) => {
                    let buffer = Buffer.concat(chunkData);
                    let toBase64 = buffer.toString("base64");
                    toBase64 = "data:image/jpeg;base64," + toBase64;

                    resolve(toBase64);
                  });
                });
              })
              .then((data) => {
                return new Promise((resolve) => {
                  cloudnary.config({
                    cloud_name: config.CLOUDINARY_CLOUD_NAME,
                    api_key: config.CLOUDINARY_API_KEY,
                    api_secret: config.CLOUDINARY_API_SECRET,
                  });
                  cloudnary.uploader.upload(
                    data,
                    { folder: config.CLOUDINARY_FOLDER_NAME },
                    function (err, result) {
                      if (!err) {
                        resolve(result.secure_url);
                      } else {
                        console.log(`cloudinary error : ${err}`);
                      }
                    }
                  );
                });
              })
              .then((result) => {
                const insert_data = {
                  user_id: userId,
                  display_name: userName,
                  cloudinary_file_url: result,
                };
                addFirestore(insert_data);
              })
              .then(() => {
                return response;
              })
              .catch((err) => {
                console.log(`firebase error : ${err}`);
              });
          });
        }
      }
    })
    .catch((err) => {
      console.log(`getProfile error : ${err}`);
    });
};
