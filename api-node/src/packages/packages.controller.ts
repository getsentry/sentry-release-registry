import { Controller, Get, Param } from '@nestjs/common';
import { RegistryService } from '../common/registry.service';
import { PackageEntry, Packages, PackageVersions } from './types';

@Controller('packages')
export class PackagesController {
  constructor(private registryService: RegistryService) {}

  @Get()
  getPackages(): Packages {
    return this.registryService.getPackages();
  }

  @Get('/:package(*)/versions')
  getPackageVersions(@Param('package') pgkName: string): PackageVersions {
    return this.registryService.getPackageVersions(pgkName);
  }

  @Get('/:package(*)/:version')
  getPackageByVersion(
    @Param('package') pkgName: string,
    @Param('version') version: string,
  ): PackageEntry {
    return this.registryService.getPackage(pkgName, version);
  }
}
