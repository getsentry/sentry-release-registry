import { PYTHON_API_URL } from './makeRequest';
import * as fs from 'fs';
import * as path from 'path';

type URLsList = {
  url: string;
  status: number;
}[];

export async function getAllYesAllUrls(): Promise<URLsList> {
  const urls: URLsList = [
    { url: '/packages', status: 200 },
    { url: '/sdks', status: 200 },
    { url: '/apps', status: 200 },
    { url: '/marketing-slugs', status: 200 },
    { url: '/aws-lambda-layers', status: 200 },
  ];

  // ------- packages -------

  const packages = await fetch(`${PYTHON_API_URL}/packages`);
  const packagesData = await packages.json();
  const canonicalPackageNames = Object.entries(packagesData).map(
    // @ts-expect-error packagesData is not typed
    (e) => e[1].canonical,
  );

  urls.push(
    ...canonicalPackageNames.map((p) => ({
      url: `/packages/${p}/latest`,
      status: 200,
    })),
  );

  let errors = 0;
  for (const packageName in packagesData) {
    const versionsUrl = `/packages/${packageName}/versions`;
    const versionsResponse = await fetch(`${PYTHON_API_URL}/${versionsUrl}`);

    if (versionsResponse.status !== 200) {
      urls.push({
        url: versionsUrl,
        status: versionsResponse.status,
      });
    } else {
      try {
        const versionsData = await versionsResponse.json();

        const allVersions: string[] = versionsData.versions;

        urls.push(
          ...allVersions.map((v) => ({
            url: `/packages/${packageName}/${v}`,
            status: 200,
          })),
        );
      } catch (e) {
        console.debug({ versionsUrl });
        console.error(e);
        ++errors;
      }
    }
  }

  // ------- sdks -------

  const sdks = await fetch(`${PYTHON_API_URL}/sdks`);
  const sdksData = await sdks.json();
  const canonicalSdkNames = Object.keys(sdksData);

  urls.push(
    ...canonicalSdkNames.map((s) => ({
      url: `/sdks/${s}/latest`,
      status: 200,
    })),
  );

  for (const sdkName in sdksData) {
    const versionsUrl = `/sdks/${sdkName}/versions`;
    const versionsResponse = await fetch(`${PYTHON_API_URL}${versionsUrl}`);

    if (versionsResponse.status !== 200) {
      urls.push({
        url: versionsUrl,
        status: versionsResponse.status,
      });
    } else {
      urls.push({
        url: versionsUrl,
        status: 200,
      });
      try {
        const versionsData = await versionsResponse.json();

        const allVersions: string[] = versionsData.versions;

        urls.push(
          ...allVersions.map((v) => ({
            url: `/sdks/${sdkName}/${v}`,
            status: 200,
          })),
        );
      } catch (e) {
        console.debug({ versionsUrl });
        console.error(e);
        ++errors;
      }
    }
  }

  // ------- apps -------

  const apps = await fetch(`${PYTHON_API_URL}/apps`);
  const appsData = await apps.json();
  const appIds = Object.keys(appsData);

  urls.push(
    ...appIds.map((a) => ({
      url: `/apps/${a}/latest`,
      status: 200,
    })),
  );
  urls.push(
    ...appIds.map((a) => ({
      url: `/apps/${a}/${appsData[a].version}`,
      status: 200,
    })),
  );

  for (const appEntry of Object.entries(appsData)) {
    const appId = appEntry[0];
    // @ts-expect-error appsData is not typed
    const fileUrls = appEntry[1].file_urls;

    for (const fileUrl of Object.entries(fileUrls)) {
      const parts = fileUrl[0].split('/').at(-1).replace('.exe', '').split('-');
      const platform = parts.at(-2);
      const arch = parts.at(-1);
      const pkgName = parts.slice(0, -2).join('-');
      if (!pkgName) {
        continue;
      }
      const downloadUrl = `/apps/${appId}/latest?response=download&platform=${platform}&arch=${arch}&package=${pkgName}`;
      const url = new URL(downloadUrl, PYTHON_API_URL);
      const downloadResponse = await fetch(url, {
        redirect: 'manual',
      });
      urls.push({
        url: downloadUrl,
        status: downloadResponse.status,
      });
    }
  }

  // ------- marketing slugs -------

  const marketingSlugs = await fetch(`${PYTHON_API_URL}/marketing-slugs`);
  const marketingSlugsData = await marketingSlugs.json();
  const marketingSlugIds = marketingSlugsData.slugs;

  urls.push(
    ...marketingSlugIds
      .filter((s) => s !== 'createdAt')
      .map((s) => ({
        url: `/marketing-slugs/${s}`,
        status: 200,
      })),
  );

  // ------- summary -------

  const numberOfUrlsByStatus = urls.reduce(
    (acc, url) => {
      acc[url.status] = (acc[url.status] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );

  console.table([
    {
      ...numberOfUrlsByStatus,
      'URL scraping errors': errors,
    },
  ]);
  fs.writeFileSync(
    path.join(__dirname, '.urls.json'),
    JSON.stringify(urls, null, 2),
    {
      flag: 'w',
    },
  );

  return urls;
}

getAllYesAllUrls();
