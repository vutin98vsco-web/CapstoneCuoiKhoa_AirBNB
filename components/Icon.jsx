export default function Icon({ name, size = 22, ...props }) {
  const paths = {
    bed: <><path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 15h18M5 9V5h14v4M8 9V7m8 2V7M3 18v3m18-3v3" /></>,
    share: <><path d="M12 16V3m-4 4 4-4 4 4M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    chevronDown: <path d="m6 9 6 6 6-6" />,
    sliders: <><path d="M4 6h5m4 0h7M4 12h10m4 0h2M4 18h2m4 0h10" /><path d="M9 3v6m5 0v6M6 15v6" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>,
    heart: <path d="M20.5 5.5a5.2 5.2 0 0 0-7.4 0L12 6.6l-1.1-1.1a5.2 5.2 0 0 0-7.4 7.4L12 21l8.5-8.1a5.2 5.2 0 0 0 0-7.4Z" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 11h18" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    star: <path d="m12 3 2.8 5.7 6.3.9-4.6 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z" />,
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" /><path d="M9 21v-8h6v8" /></>,
    wifi: <><path d="M3 8a15 15 0 0 1 18 0M6 12a10 10 0 0 1 12 0m-9 4a5 5 0 0 1 6 0" /><circle cx="12" cy="20" r=".6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    shield: <><path d="m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6Z" /><path d="m8 12 3 3 5-6" /></>,
    leaf: <><path d="M20 3C8 2 2 8 5 15s17 5 15-12Z" /><path d="M3 21 15 9" /></>,
    up: <path d="M12 20V4m-6 6 6-6 6 6" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.check}</svg>;
}
