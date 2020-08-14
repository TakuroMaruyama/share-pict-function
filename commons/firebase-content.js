const fs = require("fs");
const config = JSON.parse(fs.readFileSync("./config/config.json", "utf8"));
const firebase = require("firebase-admin");
const serviceAccount = require("../config/firebase.config.json");

const COL_SHARE_PICT = "share_pict";

exports.addFirestore = (data) => {
  return new Promise((resolve, reject) => {
    firebase.initializeApp({
      credential: firebase.credential.cert(serviceAccount),
      databaseURL: "https://share-pict.firebaseio.com",
    });
    console.log(firebase);

    const db = firebase.firestore();
    db.collection(COL_SHARE_PICT)
      .doc()
      .set({
        user_id: data.user_id,
        display_name: data.display_name,
        cloudinary_file_url: data.cloudinary_file_url,
      })
      .then((doc) => {
        resolve(doc);
      })
      .catch((err) => {
        reject(err);
      });
  });
};
