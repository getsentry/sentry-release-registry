import { AppEntry } from './types';
import { getUrlChecksums, makeDigest, findDownloadUrl } from './utils';

describe('findDownloadUrl', () => {
  it('returns the correct URL for a matching package', () => {
    const appInfo: Partial<AppEntry> = {
      file_urls: {
        'sentry-cli-Linux-x86_64':
          'https://downloads.sentry-cdn.com/sentry-cli/2.20.6/sentry-cli-Linux-x86_64',
      },
    };

    // @ts-expect-error - this is fine, passing a partial here
    const result = findDownloadUrl(appInfo, 'sentry-cli', 'x86_64', 'Linux');
    expect(result).toBe(
      'https://downloads.sentry-cdn.com/sentry-cli/2.20.6/sentry-cli-Linux-x86_64',
    );
  });

  it('returns null for a non-matching package', () => {
    const appInfo: Partial<AppEntry> = {
      file_urls: {
        'sentry-cli-Linux-x86_64':
          'https://downloads.sentry-cdn.com/sentry-cli/2.20.6/sentry-cli-Linux-x86_64',
      },
    };

    // @ts-expect-error - this is fine, passing a partial here
    const result = findDownloadUrl(appInfo, 'santry-cli', 'x64', 'linux');
    expect(result).toBeNull();
  });

  it('handles .exe files correctly', () => {
    const appInfo: Partial<AppEntry> = {
      file_urls: {
        'relay-Windows-x86_64.exe':
          'https://downloads.sentry-cdn.com/relay/24.9.0/relay-Windows-x86_64.exe',
      },
    };

    // @ts-expect-error - this is fine, passing a partial here
    const result = findDownloadUrl(appInfo, 'relay', 'x86_64', 'windows');
    expect(result).toBe(
      'https://downloads.sentry-cdn.com/relay/24.9.0/relay-Windows-x86_64.exe',
    );
  });

  it('is case-insensitive for platform and arch', () => {
    const appInfo: Partial<AppEntry> = {
      file_urls: {
        'relay-Windows-x86_64.exe':
          'https://downloads.sentry-cdn.com/relay/24.9.0/relay-Windows-x86_64.exe',
      },
    };

    // @ts-expect-error - this is fine, passing a partial here
    const result = findDownloadUrl(appInfo, 'ReLaY', 'X86_64', 'WIndOws');
    expect(result).toBe(
      'https://downloads.sentry-cdn.com/relay/24.9.0/relay-Windows-x86_64.exe',
    );
  });
});

describe('getUrlChecksums', () => {
  it('returns checksums for a matching URL', () => {
    const appInfo: Partial<AppEntry> = {
      files: {
        file1: {
          url: 'https://example.com/file1.zip',
          checksums: { 'sha256-hex': 'abcdef123456' },
        },
        file2: {
          url: 'https://example.com/file2.zip',
          checksums: { 'sha256-hex': '987654321fedcba' },
        },
      },
    };

    // @ts-expect-error - this is fine, passing a partial here
    const result = getUrlChecksums(appInfo, 'https://example.com/file1.zip');
    expect(result).toEqual({ 'sha256-hex': 'abcdef123456' });
  });

  it('returns null for a non-matching URL', () => {
    const appInfo: Partial<AppEntry> = {
      files: {
        file1: {
          url: 'https://example.com/file1.zip',
          checksums: { 'sha256-hex': 'abcdef123456' },
        },
      },
    };

    const result = getUrlChecksums(
      // @ts-expect-error - this is fine, passing a partial here
      appInfo,
      'https://example.com/nonexistent.zip',
    );
    expect(result).toBeNull();
  });

  it('returns null when checksums are not present', () => {
    const appInfo: Partial<AppEntry> = {
      files: {
        file1: {
          url: 'https://example.com/file1.zip',
        },
      },
    };

    // @ts-expect-error - this is fine, passing a partial here
    const result = getUrlChecksums(appInfo, 'https://example.com/file1.zip');
    expect(result).toBeNull();
  });

  it('handles empty files object', () => {
    const appInfo: AppEntry = {
      files: {},
    } as AppEntry;

    const result = getUrlChecksums(appInfo, 'https://example.com/file1.zip');
    expect(result).toBeNull();
  });
});

describe('makeDigest', () => {
  it('returns an empty string for null input', () => {
    expect(makeDigest(null)).toBe('');
  });

  it('correctly processes hex checksums', () => {
    const input = { 'sha256-hex': '68656c6c6f' }; // 'hello' in hex
    expect(makeDigest(input)).toBe('sha256=aGVsbG8=');
  });

  it('correctly processes base64 checksums', () => {
    const input = { 'sha256-base64': 'aGVsbG8=' }; // 'hello' in base64
    expect(makeDigest(input)).toBe('sha256=aGVsbG8=');
  });

  it('handles multiple checksums', () => {
    const input = {
      'sha256-hex': '68656c6c6f',
      'md5-base64': 'XUFAKrxLKna5cZ2REBfFkg==',
    };
    expect(makeDigest(input)).toBe(
      'sha256=aGVsbG8=,md5=XUFAKrxLKna5cZ2REBfFkg==',
    );
  });

  it('ignores checksums that do not end with -hex or -base64', () => {
    const input = {
      'sha256-hex': '68656c6c6f',
      'md5-invalid': 'ignored',
    };
    expect(makeDigest(input)).toBe('sha256=aGVsbG8=');
  });
});
