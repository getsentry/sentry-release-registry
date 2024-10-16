import { Controller, Get } from '@nestjs/common';
import { RegistryService } from '../common/registry.service';
import { AwsLambdaLayers } from './types';

@Controller('aws-lambda-layers')
export class AwsLambdaLayersController {
  constructor(private readonly registryService: RegistryService) {}

  @Get()
  getLayers(): AwsLambdaLayers {
    return this.registryService.getAwsLambdaLayers();
  }
}
