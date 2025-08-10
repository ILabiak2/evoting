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
  BadRequestException,
} from '@nestjs/common';
import { ElectionService } from './election.service';
import { CreateElectionDto } from './dto/create-election.dto';
import { GenerateInvitesDto } from './dto/generate-invites.dto';
import { UpdateElectionDto } from './dto/update-election.dto';
import { EthAddressPipe } from '@/common/pipes/eth-address.pipe';
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
  findAll(@User() user) {
    if (user.role === 'creator') {
      return this.electionService.getCreatorElections(user.userId);
    }
    if (user.role === 'user') {
      return this.electionService.getUserElections(user.userId);
    }
  }

  @Get(':address')
  findOne(@Param('address') address: string, @User('userId') userId: string) {
    return this.electionService.getElectionData(address, userId);
  }

  @Post(':address/invites')
  async generateInvites(
    @Param('address', EthAddressPipe) address: string,
    @Body() dto: GenerateInvitesDto,
    @User('userId') userId: string,
  ) {
    return this.electionService.generateInvites(address, dto.quantity, userId);
  }

  @Post(':address/join')
  async joinPublic(
    @Param('address', EthAddressPipe) address: string,
    @User('userId') userId: string,
  ) {
    return this.electionService.joinPublicElection(address, userId);
  }

  @Post(':address/leave')
  async leavePublic(
    @Param('address', EthAddressPipe) address: string,
    @User('userId') userId: string,
  ) {
    return this.electionService.leavePublicElection(address, userId);
  }

  @Post('join-with-invite')
  async joinWithInvite(
    @Body('code') code: string,
    @User('userId') userId: string,
  ) {
    if (!code || typeof code !== 'string') {
      throw new BadRequestException('Invite code is required');
    }
    return this.electionService.joinPrivateElection(code.trim(), userId);
  }
}
