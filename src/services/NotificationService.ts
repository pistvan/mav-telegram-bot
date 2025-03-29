import cron from 'node-cron';
import { Repository } from 'typeorm';
import { Notification } from '../entities/Notification';
import NotificationRepository from '../repositories/App/NotificationRepository';
import { CronServiceInterface } from './CronServiceInterface';
import { VonatinfoRepository, VonatinfoRepositoryInterface } from './Mav';
import { MessageServiceInterface } from './MessageServiceInterface';
import MessageService from './MessageService';
import ReportError from './decorators/ReportError';
import { Format } from 'telegraf';

export const DaysOfTheWeek = [
    `hétfő`,
    `kedd`,
    `szerda`,
    `csütörtök`,
    `péntek`,
    `szombat`,
    `vasárnap`,
] as const satisfies string[];

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

    /**
     * Creates a new notification, schedules it, and sends an acknowledgment message to the chat.
     */
    public async create(entity: Pick<Notification, 'train' | 'schedule' | 'chat'>): Promise<Notification> {
        const notification = await this.notificationRepository.save(entity);
        console.log(`The notification has been saved:`, notification);
        this.schedule(notification);

        this.messageService.sendMessage(entity.chat.id, this.formatNotificationCreated(notification));

        return notification;
    }

    public async remove(notification: Notification) {
        await this.notificationRepository.remove(notification);
        const name = this.getName(notification);
        const task = this.cronService.getTasks().get(name);
        task?.stop();
    }

    public async findById(id: number): Promise<Notification | null> {
        return await this.notificationRepository.findOneBy({ id });
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

    public formatNotificationCreated(notification: Notification): Format.FmtString {
        const lines = [
            Format.join`✅ Értesítés létrehozva 🚂 ${Format.bold(notification.train)} számú vonathoz.`,
        ];

        if (notification.schedule.type === 'once') {
            lines.push(
                // TODO: format the date
                Format.join`⏰ ${Format.bold(notification.schedule.date)}`,
                Format.join`Törlés: /leiratkozas_${notification.id}`,
            );
        } else if (notification.schedule.type === 'weekly') {
            const days = notification.schedule.days.map((day) => DaysOfTheWeek[day]);
            lines.push(
                Format.join`📅 ${Format.bold(days.join(', '))}`,
                Format.join`⏰ ${Format.bold(notification.schedule.time)}`,
                Format.join`Leiratkozás: /leiratkozas_${notification.id}`,
            );
        }

        return Format.join(lines, `\n`);
    }
}

export default new NotificationService(
    NotificationRepository,
    cron,
    VonatinfoRepository,
    MessageService,
);
