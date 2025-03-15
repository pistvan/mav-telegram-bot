import cron from 'node-cron';

export interface CronServiceInterface {
    schedule: typeof cron.schedule;
    validate: typeof cron.validate;
    getTasks: typeof cron.getTasks;
}
