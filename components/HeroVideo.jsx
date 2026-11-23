'use client';

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from './LanguageProvider';

export default function HeroVideo() {
  const { t } = useLanguage();
  const video = useRef(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 600px)');
    const element = video.current;
    const play = () => { if (media.matches || navigator.connection?.saveData || document.hidden) { element.pause(); } else { element.play().catch(() => {}); } };
    play();
    document.addEventListener('visibilitychange', play);
    media.addEventListener('change', play);
    return () => { document.removeEventListener('visibilitychange', play); media.removeEventListener('change', play); };
  }, []);
  return <><video ref={video} className="hero-video" muted loop playsInline preload="none" poster="/images/hero.webp" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}><source src="/images/vietnam.mp4" type="video/mp4" /></video><button className="video-toggle" aria-label={playing ? t.pauseVideo : t.playVideo} onClick={() => playing ? video.current.pause() : video.current.play().catch(() => {})}>{playing ? 'Ⅱ' : '▷'} <span>{playing ? t.pause : t.play}</span></button></>;
}
