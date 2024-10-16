import { Controller, Get } from '@nestjs/common';
import { RegistryService } from '../registry/registry.service';

@Controller('aws-lambda-layers')
export class AwsLambdaLayersController {
  // TODO: types

  constructor(private readonly registryService: RegistryService) {}

  @Get()
  async getLayers() {
    return this.registryService.getAwsLambdaLayers();
  }
}
