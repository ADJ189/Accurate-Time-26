const WMO: Record<number, string> = {
  0:'☀',1:'🌤',2:'⛅',3:'☁',45:'🌫',48:'🌫',51:'🌦',53:'🌦',55:'🌧',
  61:'🌧',63:'🌧',65:'🌧',71:'🌨',73:'🌨',75:'🌨',80:'🌦',81:'🌧',
  82:'🌧',95:'⛈',96:'⛈',99:'⛈',
};

export async function initWeather(
  iconEl: HTMLElement,
  textEl: HTMLElement,
  pillEl: HTMLElement,
) {
  const show = (icon: string, text: string) => {
    iconEl.textContent = icon;
    textEl.textContent = text;
    pillEl.classList.add('loaded');
  };

  if (!navigator.geolocation) { show('🌡', '—'); return; }

  navigator.geolocation.getCurrentPosition(
    async ({ coords: { latitude: lat, longitude: lon } }) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&temperature_unit=celsius&timezone=auto`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        const data = await res.json();
        show(WMO[data.current.weathercode] ?? '🌡', `${Math.round(data.current.temperature_2m)}°C`);
      } catch { show('🌡', '—'); }
    },
    () => show('🌡', '—'),
    { timeout: 8000, maximumAge: 600_000 },
  );
}
