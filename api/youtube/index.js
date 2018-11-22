module.exports = YOUTUBE_CRON => {
  var request = require("request-promise");
  const cache = require("../../cache");
  const firebase = require("../firebase");
  const logger = require("../logger");
  const { cronRunnerData } = require("../firebase");
  let YOUTUBE_API_KEY;
  cronRunnerData(`cron/runners/${YOUTUBE_CRON}`, value => {
    YOUTUBE_API_KEY = value.key;
    console.log("using new key", YOUTUBE_API_KEY);
  });

  const infoConstructor = item => {
    const { id, snippet, statistics, brandingSettings } = item;
    const { title, customUrl = null, description = null, thumbnails } = snippet;
    const { channel, image } = brandingSettings;
    const {
      keywords = null,
      featuredChannelsUrls = null,
      profileColor = null,
      unsubscribedTrailer = null
    } = channel;
    const smallImage = thumbnails.default.url;
    const mediumImage = thumbnails.medium.url;
    const largeImage = thumbnails.high.url;
    const { viewCount, subscriberCount, videoCount } = statistics;

    return {
      id,
      title,
      url: "https://youtube.com/channel/" + id,
      description,
      smallImage,
      mediumImage,
      largeImage,
      viewCount,
      subscriberCount,
      viewCount,
      videoCount,
      image,
      keywords,
      featuredChannelsUrls,
      profileColor,
      unsubscribedTrailer,
      customUrl
    };
  };

  const videoConstructor = item => {
    const { id, snippet } = item;
    const { videoId } = id;
    const {
      channelId,
      title,
      description,
      channelTitle,
      liveBroadcastContent,
      publishedAt,
      thumbnails
    } = snippet;
    const { high } = thumbnails;
    const youtubeVideoURLBase = "https://youtu.be/";
    const videoUrl = youtubeVideoURLBase + videoId;
    const { url } = high;
    const thumbnailUrl = url;

    return {
      videoId,
      title,
      channelTitle,
      liveBroadcastContent,
      videoUrl,
      thumbnailUrl,
      publishedAt,
      description,
      channelId
    };
  };

  const getBySearch = async query => {
    query = `${query}&key=${YOUTUBE_API_KEY}`;
    let result;
    try {
      result = await request({
        url: `https://www.googleapis.com/youtube/v3/search${query}`,
        method: "GET",
        json: true
      });
      return result;
    } catch (error) {
      logger.error(error);
      return error;
    }
  };

  const getByChannels = async query => {
    query = `${query}&key=${YOUTUBE_API_KEY}`;
    let result;
    try {
      result = await request({
        url: `https://www.googleapis.com/youtube/v3/channels${query}`,
        method: "GET",
        json: true
      });

      return result;
    } catch (error) {
      logger.error(error);
      return error;
    }
  };

  const getChannelDetailsAndUpdateDB = async ({ query, ...rest }) => {
    const { items = [] } = await getByChannels(query);
    items.forEach(item => {
      firebase.sendInfoToDB({ ...infoConstructor(item), ...rest });
    });
  };

  const getVideosAndUpdateDB = async ({ query, ...rest }) => {
    const { items = [] } = await getBySearch(query);
    items.forEach(item => {
      firebase.sendVideoToDB({ ...videoConstructor(item), ...rest });
    });
  };

  return {
    getChannelDetailsAndUpdateDB,
    getVideosAndUpdateDB
  };
};
