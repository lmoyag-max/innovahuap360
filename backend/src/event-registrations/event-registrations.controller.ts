import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { CreateEventRegistrationDto } from './dto/create-event-registration.dto';
import { EventRegistrationsService } from './event-registrations.service';

@ApiTags('event-registrations')
@Controller()
export class EventRegistrationsController {
  constructor(private readonly service: EventRegistrationsService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('public/eventos/:eventId/inscripciones')
  create(@Param('eventId') eventId: string, @Body() dto: CreateEventRegistrationDto) {
    return this.service.create(eventId, dto);
  }
}
