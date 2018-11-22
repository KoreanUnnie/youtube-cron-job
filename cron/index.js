module.exports = YOUTUBE_CRON => {
  // long running tasks
  const schedule = require("node-schedule");
  const youtube = require("../api/youtube")(YOUTUBE_CRON);
  const logger = require("../api/logger");
  const { cronRunnerData } = require("../api/firebase");
  let schedules = [];

  cronRunnerData(`cron/runners/${YOUTUBE_CRON}/schedules`, value => {
    const newSchedules = value;
    console.log("updating schedules");
    schedules.forEach(sch => {
      sch.cancel();
    });
    schedules = [];
    // add newschedules
    setTimeout(() => {
      newSchedules.forEach(sch => {
        const { rule } = sch.schedule;
        const rules = new schedule.RecurrenceRule();
        Object.keys(rule).forEach(rname => {
          rules[rname] = rule[rname];
        });
        let newSch = schedule.scheduleJob(rules, () => {
          sch.functions.forEach(options => {
            logger.info(
              `${sch.schedule.name}: ${options.function}(); ${
                options.processName
              }`
            );
            youtube[options.function](options);
          });
        });
        schedules.push(newSch);
      });
    }, 10000);
  });
};
