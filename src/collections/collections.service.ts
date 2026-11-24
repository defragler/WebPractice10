import { BadRequestException, Injectable } from '@nestjs/common';
import { EventsGateway } from '../notifications/events.gateway';
import { MailService } from '../notifications/mail.service';
import { StartDropDto } from './dto/start-drop.dto';

@Injectable()
export class CollectionsService {
  constructor(
    private readonly eventsGateway: EventsGateway,
    private readonly mailService: MailService,
  ) {}

  async startDrop(
    collectionId: string,
    dto: StartDropDto,
  ): Promise<{
    success: boolean;
    message: string;
    room: string;
    event: string;
    emailMessageId: string;
  }> {
    const normalizedId = collectionId.trim();
    if (!normalizedId) {
      throw new BadRequestException('Ідентифікатор колекції обов’язковий');
    }

    const collectionName = dto.collectionName?.trim() || `Сезонна колекція ${normalizedId}`;
    const room = `drop_${normalizedId}`;
    const event = 'dropStarted';
    const payload = {
      collectionId: normalizedId,
      collectionName,
      status: 'STARTED',
      startedAt: new Date().toISOString(),
      message: `Продаж колекції «${collectionName}» розпочато`,
    };

    // WebSocket-подія надсилається підписникам кімнати.
    this.eventsGateway.emitToRoom(room, event, payload);

    // Лист надсилається через локальну SMTP-пастку Mailpit.
    try {
      const html = this.mailService.createDropStartedTemplate(
        collectionName,
        normalizedId,
      );
      const emailMessageId = await this.mailService.sendNotificationEmail(
        dto.customerEmail,
        `Старт продажу нової колекції: ${collectionName}`,
        html,
      );

      return {
        success: true,
        message: 'Продаж колекції розпочато, WebSocket-сповіщення та Email надіслано',
        room,
        event,
        emailMessageId,
      };
    } catch (error) {
      // Не приховуємо помилку SMTP: WebSocket-подія вже могла бути доставлена.
      throw error;
    }
  }
}
