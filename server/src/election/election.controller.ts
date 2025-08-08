import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ElectionService } from './election.service';
import { CreateElectionDto } from './dto/create-election.dto';
import { UpdateElectionDto } from './dto/update-election.dto';
import { User } from '@/common/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('election')
export class ElectionController {
  constructor(private readonly electionService: ElectionService) {}

  @Post()
  create(@Body() createElectionDto: CreateElectionDto, @User() user) {
    if (user.role !== 'creator') {
      throw new ForbiddenException(
        'You are not authorized to create elections',
      );
    }
    return this.electionService.create(createElectionDto, user.userId);
  }

  @Get('status/:txHash')
  async checkStatus(@Param('txHash') txHash: string) {
    return this.electionService.checkStatus(txHash);
  }

  @Get()
  findAll(@User('userId') userId: string) {
    return this.electionService.getUserElections(userId);
  }

  @Get(':address')
  findOne(@Param('address') address: string) {
    return this.electionService.getElectionData(address);
  }
}
