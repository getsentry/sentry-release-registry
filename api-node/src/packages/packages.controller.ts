import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { RegistryService } from '../common/registry.service';
import { PackageEntry, Packages, PackageVersions } from './types';
import { ReleaseRegistryCacheInterceptor } from '../common/cache';
import { isTruthy } from 'src/common/utils';

@Controller('packages')
@UseInterceptors(ReleaseRegistryCacheInterceptor)
export class PackagesController {
  constructor(private registryService: RegistryService) {}

  @Get()
  getPackages(@Query('strict') strict?: string): Packages {
    return this.registryService.getPackages(isTruthy(strict));
  }

  @Get('/:package(*)/versions')
  getPackageVersions(@Param('package') pgkName: string): PackageVersions {
    const latest = this.registryService.getPackage(pgkName);
    if (!latest) {
      throw new NotFoundException();
    }
    const versions = this.registryService.getPackageVersions(pgkName);
    return { versions, latest };
  }

  @Get('/:package(*)/:version')
  getPackageByVersion(
    @Param('package') pkgName: string,
    @Param('version') version: string,
  ): PackageEntry | null {
    const pkg = this.registryService.getPackage(pkgName, version);
    if (!pkg) {
      throw new NotFoundException();
    }
    return pkg;
  }
}
