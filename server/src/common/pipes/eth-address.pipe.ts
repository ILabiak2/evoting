import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class EthAddressPipe implements PipeTransform<string, string> {
  transform(value: string) {
    const isEth = /^0x[a-fA-F0-9]{40}$/.test(value);
    if (!isEth) throw new BadRequestException('Invalid election address');
    return value;
  }
}