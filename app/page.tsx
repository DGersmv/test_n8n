'use client';

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Telegram?: any;
  }
}

const WEBHOOK_URL =
  'https://gdvn8n.app.n8n.cloud/webhook/a2ef5a80-c5d4-4ae0-a995-c7a6b404d5c8';

export default function Page() {
  const [tabs, setTabs] = useState<string[]>([]);
  const [tab, setTab] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string>('');

  // 🔹 Загрузка вкладок
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    tg?.ready();
    tg?.expand();

    const loadTabs = async () => {
      try {
        setStatus('Загружаю список объектов…');

        const r = await fetch(WEBHOOK_URL, {
          method: 'GET',
        });

        if (!r.ok) throw new Error('Webhook не отвечает');

        const j = await r.json();

        if (!j?.tabs) {
          throw new Error('В ответе нет поля tabs');
        }

        setTabs(j.tabs);
        setStatus('');
      } catch (e: any) {
        setStatus('Ошибка загрузки вкладок: ' + e.message);
      }
    };

    loadTabs();
  }, []);

  // 🔹 Отправка поиска
  async function submit() {
    if (!tab) return setStatus('Выберите объект');
    if (!query.trim()) return setStatus('Введите что ищем');

    try {
      const tg = window.Telegram?.WebApp;
      const init = tg?.initDataUnsafe;

      setStatus('Отправляю запрос…');

      const payload = {
        action: 'search', // 👈 важно: чтобы в n8n понимать что это POST-поиск
        tab,
        query: query.trim(),
        tg: {
          userId: init?.user?.id,
          chatId: init?.chat?.id,
        },
        initData: tg?.initData,
      };

      const r = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!r.ok) throw new Error('Ошибка запроса');

      const j = await r.json().catch(() => ({}));

      setStatus(j?.message ?? 'Готово ✅');
    } catch (e: any) {
      setStatus('Ошибка отправки: ' + e.message);
    }
  }

  return (
    <div style={{ padding: 16, fontFamily: 'system-ui' }}>
      <h2>Таблица материалов</h2>

      <label>Объект (вкладка):</label>
      <select
        value={tab}
        onChange={(e) => setTab(e.target.value)}
        style={{ width: '100%', padding: 8, marginTop: 6 }}
      >
        <option value="">— выбрать —</option>
        {tabs.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <div style={{ height: 12 }} />

      <label>Что ищем:</label>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Например: бойлер Thermex 100л"
        style={{ width: '100%', padding: 8, marginTop: 6 }}
      />

      <div style={{ height: 12 }} />

      <button
        onClick={submit}
        style={{
          width: '100%',
          padding: 12,
          background: '#2AABEE',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
        }}
      >
        Найти
      </button>

      {status && <p style={{ marginTop: 12 }}>{status}</p>}
    </div>
  );
}