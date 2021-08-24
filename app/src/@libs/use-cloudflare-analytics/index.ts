import { useEffect } from 'react';

interface Options {
  token: string | undefined;
  hostnames: string[];
}

export function useCloudflareAnalytics({ token, hostnames }: Options) {
  useEffect(() => {
    if (token && hostnames.includes(window.location.hostname)) {
      const script = document.createElement('script');
      script.defer = true;
      script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
      script.setAttribute('data-cf-beacon', `{"token": "${token}"}`);

      const head = document.querySelector('head');
      head?.appendChild(script);
    }
  }, [hostnames, token]);
}
