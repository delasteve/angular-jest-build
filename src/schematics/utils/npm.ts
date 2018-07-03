import { Observable, Subject } from 'rxjs';
import { get } from 'https';

interface RegistryInformation {
  'dist-tags': {
    latest: string;
    [key: string]: string;
  };
}

export interface PackageInformation {
  name: string;
  version: string;
}

export function getLatestPackageVersion(packageName: string): Observable<PackageInformation> {
  const subject = new Subject<PackageInformation>();
  const url = `https://registry.npmjs.org/${packageName}`;

  const request = get(url, response => {
    let data = '';
    response.on('data', chunk => (data += chunk));
    response.on('end', () => {
      try {
        const registryInfo: RegistryInformation = JSON.parse(data);

        subject.next({
          name: packageName,
          version: registryInfo['dist-tags'].latest
        });
        subject.complete();
      } catch (error) {
        subject.error(error);
      }
    });

    response.on('error', error => subject.error(error));
  });

  request.end();

  return subject.asObservable();
}
