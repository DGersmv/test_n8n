'use client';

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Telegram?: any;
  }
}

const WEBHOOK_URL =
  'https://gdvn8n.app.n8n.cloud/webhook/0399bfa8-6e2a-4a9e-8e18-6c41879bd4a5';

interface Result {
  shop: string;
  name: string;
  price: number | string | null;
  url: string;
}

interface Summary {
  count: number;
  minPrice: string;
  maxPrice: string;
}

export default function Page() {
  const [tabs, setTabs] = useState<string[]>([]);
  const [tab, setTab] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string>('');
  const [results, setResults] = useState<Result[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [review, setReview] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    tg?.ready();
    tg?.expand();

    const loadTabs = async () => {
      try {
        setStatus('Загружаю список объектов…');
        const r = await fetch(WEBHOOK_URL, { method: 'GET' });
        if (!r.ok) throw new Error(`Ошибка ${r.status}`);
        const j = await r.json();
        if (!j?.tabs) throw new Error('Нет поля tabs');
        setTabs(j.tabs);
        setStatus('');
      } catch (e: any) {
        setStatus('⚠️ ' + e.message);
      }
    };

    loadTabs();
  }, []);

  async function submit() {
    if (!tab) return setStatus('⚠️ Выберите объект');
    if (!query.trim()) return setStatus('⚠️ Введите что ищем');

    try {
      const tg = window.Telegram?.WebApp;
      setLoading(true);
      setStatus('🔍 Ищу цены в магазинах…');
      setResults([]);
      setSummary(null);

      const r = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search',
          tab,
          query: query.trim(),
          tg: { userId: tg?.initDataUnsafe?.user?.id },
        }),
      });

      if (!r.ok) throw new Error(`Ошибка сервера ${r.status}`);
      const j = await r.json().catch(() => ({}));

      if (j?.results?.length > 0) {
        setResults(j.results);
        setSummary(j.summary || null);
        setReview(j.review || '');
        setStatus('');
      } else {
        setStatus('🔍 Ничего не найдено');
      }
    } catch (e: any) {
      setStatus('❌ ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      padding: '16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      maxWidth: 480,
      margin: '0 auto',
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700 }}>
        🔍 Поиск материалов
      </h2>

      <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 4 }}>Объект</label>
        <select
          value={tab}
          onChange={(e) => setTab(e.target.value)}
          style={{
            width: '100%', padding: '10px 8px', borderRadius: 8,
            border: '1px solid #ddd', fontSize: 15, marginBottom: 12,
            background: '#fafafa', boxSizing: 'border-box'
          }}
        >
          <option value="">— выбрать —</option>
          {tabs.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 4 }}>Что ищем</label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Например: бойлер Thermex 100л"
          style={{
            width: '100%', padding: '10px 8px', borderRadius: 8,
            border: '1px solid #ddd', fontSize: 15,
            background: '#fafafa', boxSizing: 'border-box'
          }}
        />
      </div>

      <button
        onClick={submit}
        disabled={loading}
        style={{
          width: '100%', padding: 14,
          background: loading ? '#aaa' : '#2AABEE',
          color: '#fff', border: 'none', borderRadius: 12,
          fontSize: 16, fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: 12
        }}
      >
        {loading ? '⏳ Ищу…' : '🔍 Найти'}
      </button>

      {status && (
        <div style={{ padding: 12, background: '#fff', borderRadius: 10, marginBottom: 12, fontSize: 14 }}>
          {status}
        </div>
      )}

      {(results.length > 0 || review) && (
        <div style={{
          background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
          borderLeft: '4px solid #2AABEE'
        }}>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
            Найдено предложений: <strong>{results.length}</strong>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: review ? 12 : 0 }}>
            <div style={{ flex: 1, background: '#f0fff4', borderRadius: 8, padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>Минимум</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#27ae60' }}>
                {results.length > 0 ? Math.min(...results.filter(r => r.price).map(r => Number(r.price))).toLocaleString('ru-RU') + ' ₽' : '—'}
              </div>
            </div>
            <div style={{ flex: 1, background: '#fff5f5', borderRadius: 8, padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>Максимум</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#e74c3c' }}>
                {results.length > 0 ? Math.max(...results.filter(r => r.price).map(r => Number(r.price))).toLocaleString('ru-RU') + ' ₽' : '—'}
              </div>
            </div>
          </div>
          {review && (
            <div style={{ fontSize: 13, color: '#444', lineHeight: 1.5, borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
              {review}
            </div>
          )}
        </div>
      )}

      {results.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
          {results.map((item, i) => (
            <div key={i} style={{
              padding: '12px 16px',
              borderBottom: i < results.length - 1 ? '1px solid #f0f0f0' : 'none'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, marginRight: 8 }}>
                  <span style={{
                    fontSize: 11, background: '#e8f4fd', color: '#2AABEE',
                    padding: '2px 6px', borderRadius: 4, marginBottom: 4, display: 'inline-block'
                  }}>
                    {item.shop}
                  </span>
                  <div style={{ fontSize: 13, color: '#333', marginTop: 2 }}>{item.name}</div>
                </div>
                {item.price && (
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#e74c3c', whiteSpace: 'nowrap' }}>
                    {typeof item.price === 'number' ? item.price.toLocaleString('ru-RU') + ' ₽' : item.price}
                  </div>
                )}
              </div>
              {item.url && (
                <a href={item.url} target="_blank" rel="noreferrer"
                  style={{ fontSize: 12, color: '#2AABEE', marginTop: 4, display: 'block' }}>
                  Открыть →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
