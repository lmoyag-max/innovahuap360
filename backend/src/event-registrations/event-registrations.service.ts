import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateEventRegistrationDto } from './dto/create-event-registration.dto';

@Injectable()
export class EventRegistrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async create(eventId: string, dto: CreateEventRegistrationDto) {
    const event = await this.prisma.publicContent.findFirst({
      where: { id: eventId, section: 'EVENTOS', isPublished: true },
      select: { id: true, title: true },
    });
    if (!event) {
      throw new NotFoundException('El evento seleccionado no existe o ya no está disponible.');
    }

    const registration = await this.prisma.eventRegistration.create({
      data: { eventId: event.id, eventTitle: event.title, ...dto },
    });

    await this.notify(registration);

    return { id: registration.id };
  }

  private async recipientEmails(): Promise<string[]> {
    const [admins, committee] = await Promise.all([
      this.prisma.user.findMany({
        where: { isActive: true, deletedAt: null, role: { key: { in: ['admin', 'super_admin'] } } },
        select: { email: true },
      }),
      this.prisma.committeeMember.findMany({
        where: { isActive: true },
        include: { user: { select: { email: true } } },
      }),
    ]);
    const emails = [...admins.map((a) => a.email), ...committee.map((c) => c.user.email)];
    return [...new Set(emails)];
  }

  private async notify(registration: {
    fullName: string;
    rut: string;
    email: string;
    phone: string;
    unit: string;
    position: string;
    observation: string | null;
    eventTitle: string;
    createdAt: Date;
  }) {
    const to = await this.recipientEmails();
    await this.mail.sendEventRegistrationCommitteeEmail(to, registration);
    await this.mail.sendEventRegistrationApplicantEmail(registration.email, registration);
  }
}
