import cron from 'node-cron';
import { Repository } from 'typeorm';
import { Notification } from '../entities/Notification';
import NotificationRepository from '../repositories/App/NotificationRepository';
import { CronServiceInterface } from './CronServiceInterface';
import { VonatinfoRepository, VonatinfoRepositoryInterface } from './Mav';
import { MessageServiceInterface } from './MessageServiceInterface';
import MessageService from './MessageService';
import ReportError from './decorators/ReportError';

export class NotificationService {
    public constructor(
        protected notificationRepository: Repository<Notification>,
        protected cronService: CronServiceInterface,
        protected vonatinfoRepository: VonatinfoRepositoryInterface,
        protected messageService: MessageServiceInterface,
    ) {
    }

    /**
     * Schedule the existing notifications.
     */
    public async start() {
        const notifications = await this.notificationRepository.find();

        for (const notification of notifications) {
            this.schedule(notification);
        }
    }

    /**
     * Stop all the scheduled notifications.
     */
    public stop() {
        const notifications = this.cronService.getTasks();
        for (const [, notification] of notifications) {
            notification.stop();
        }
    }

    public async create(entity: Partial<Notification>) {
        const notification = await this.notificationRepository.save(entity);
        console.log(`The notification has been saved:`, notification);
        this.schedule(notification);
    }

    public async remove(notification: Notification) {
        await this.notificationRepository.remove(notification);
        const name = this.getName(notification);
        const task = this.cronService.getTasks().get(name);
        task?.stop();
    }

    /**
     * Handle the notification.
     */
    @ReportError()
    public async handle(notification: Notification) {
        console.log(`Notification ${notification.id} triggered.`);

        const messageLines: string[] = [
            `ℹ️ Értesítés a ${notification.train} számú vonatról.`,
        ];

        const realtimeTrains = await this.vonatinfoRepository.getRealtimeTrains();
        const train = realtimeTrains.find(train => train.code === notification.train);
        if (!train) {
            messageLines.push(`🚫 A vonat nem található az Vonatinfón.`);
            await this.messageService.sendMessage(notification.chat.id, messageLines.join(`\n`));
            return;
        }

        messageLines.push(train.delay > 0
            ? `⏰ A vonat ${train.delay} perc késésben van.`
            : `🕒 A vonat időben érkezik.`,
        );
        await this.messageService.sendMessage(notification.chat.id, messageLines.join(`\n`));

        if (notification.schedule.type === 'once') {
            await this.remove(notification);
        }
    }

    protected schedule(notification: Notification) {
        const cronExpression = this.getCronExpression(notification);

        const handler = () => this.handle(notification);
        this.cronService.schedule(cronExpression, handler, {
            name: this.getName(notification),
        });

        console.log(`Notification #${notification.id} has been scheduled with this expression: ${cronExpression}`);
    }

    /**
     * Returns the cron expresion of the given notification.
     *
     * @returns Minute Hour Day Month DayOfWeek
     */
    protected getCronExpression({ schedule }: Notification): string {
        if (schedule.type === 'once') {
            const date = new Date(schedule.date);
            // TODO: if the date is in the past, use the current date,
            // as the cron job will be executed immediately.
            return `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;
        } else if (schedule.type === 'weekly') {
            const [hours, minutes] = schedule.time.split(':').map(Number);
            return `${minutes} ${hours} * * ${schedule.days.join(',')}`;
        } else {
            throw new Error('Invalid schedule type.');
        }
    }

    /**
     * Returns the internal name of the notification.
     */
    protected getName(notification: Notification): string {
        return `notification-${notification.id}`;
    }

    /**
     * Reports the administator about the error.
     */
    protected reportError(error: Error) {
        console.error(error);
    }
}

export default new NotificationService(
    NotificationRepository,
    cron,
    VonatinfoRepository,
    MessageService,
);
