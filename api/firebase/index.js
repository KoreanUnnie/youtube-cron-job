// methods to call firebase db
const db = require("./firebase").database;
const cache = require("../../cache");
const moment = require("moment");
const videoDBRes = "videos";
let YOUTUBE_CRON;
let YOUTUBE_API_KEY;
let found = false;
db.ref("cron/runners").on("value", v => {
  const runners = v.val();
  if (runners && !YOUTUBE_CRON) {
    runners.forEach((runnerItem, index) => {
      if (found) return;
      if (!runnerItem.inUse) {
        // we can use this runner
        //update runner.inUse = true
        YOUTUBE_CRON = index;
        found = true;
        db.ref(`cron/runners/${index}`).update({
          inUse: true,
          instance: YOUTUBE_CRON
        });
        require("../../cron")(index);
      }
    });
  }
  if (YOUTUBE_CRON) {
    console.log("already connected");
  } else {
    console.log("could not connect");
  }
});
const disconnectRunner = async () => {
  await db.ref(`cron/runners/${YOUTUBE_CRON}`).update({
    inUse: null,
    instance: null
  });
  process.exit(0);
};
const cronRunnerData = (ref, callback) => {
  return db.ref(ref).on("value", v => {
    const value = v.val();
    if (value) {
      callback(value);
    }
  });
};
// keep video cache in sync
cronRunnerData(videoDBRes + "/processed", value => {
  cache.videos = value;
});

const sendVideoToDB = async ({ videoId, liveBroadcastContent, ...rest }) => {
  const video = {
    ...rest,
    videoId,
    liveBroadcastContent,
    timestamp: moment().format()
  };
  if (videoId in cache.videos) {
    // video is in local cache, dont do anything
    return;
  }
  if (liveBroadcastContent === "live" || liveBroadcastContent === "upcoming") {
    const puppetRef = db.ref("livechat/puppet/video/tasks");
    const key = await puppetRef.push().key;
    puppetRef.child(key).update(video);
  }

  const dbBaseRef = db.ref(videoDBRes + "/tasks");
  const key = await dbBaseRef.push().key;
  dbBaseRef.child(key).update(video);
  cache.videos[videoId] = 1; // add to cache
};

const sendInfoToDB = async info => {
  const dbBaseRef = db.ref(videoDBRes + "/channel/" + info.id);
  await dbBaseRef.set(info);
};

module.exports.sendVideoToDB = sendVideoToDB;
module.exports.sendInfoToDB = sendInfoToDB;
module.exports.cronRunnerData = cronRunnerData;
module.exports.disconnectRunner = disconnectRunner;
module.exports.YOUTUBE_API_KEY = YOUTUBE_API_KEY;
