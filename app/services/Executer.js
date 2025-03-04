
const schedule = require('node-schedule');

// با استفاده از فرمت cron:
const job = schedule.scheduleJob('0 3 * * 5', () => {
    //   console.log('وظیفه زمان‌بندی شده: هر هفته جمعه ساعت 3 صبح اجرا می‌شود');

    console.log("Test");
    
});

console.log("Executer Service started'");
