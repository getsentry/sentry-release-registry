import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { RegistryService } from '../common/registry.service';
import { AwsLambdaLayers } from './types';
import { ReleaseRegistryCacheInterceptor } from '../common/cache';

@Controller('aws-lambda-layers')
@UseInterceptors(ReleaseRegistryCacheInterceptor)
export class AwsLambdaLayersController {
  constructor(private readonly registryService: RegistryService) {}

  @Get()
  getLayers(): AwsLambdaLayers {
    return this.registryService.getAwsLambdaLayers();
  }
}
