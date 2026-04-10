* Pacifica Intelligence — Market Dashboard*

> Real-time perpetuals analytics dashboard built on Pacifica's infrastructure.
> Submitted for the *Pacifica Hackathon 2026 — Analytics & Data Track*.

Live Demo: https://pacifica-vercel.vercel.app

---

 What It Does

Pacifica Intelligence is a real-time market analytics dashboard for Pacifica perpetuals. It gives traders an at-a-glance view of orderbook depth, buying/selling pressure, funding rates across all markets, and live trade flow — all updating in real time via WebSocket.

### Core Features

**Orderbook Heatmap**
Visualizes the top 10 bid and ask levels as a color-coded heatmap. Bar width represents cumulative depth at each price level, making it easy to spot where liquidity is concentrated. Spread is calculated and displayed in real time. Updates every 100ms via the Pacifica WebSocket `book` channel.

**Bid/Ask Imbalance Engine**
Calculates the ratio of total bid volume vs ask volume across the visible orderbook and expresses it as a signed percentage. Automatically classifies market pressure into five signals: Strong Buy Pressure, Mild Buy Pressure, Balanced, Mild Sell Pressure, Strong Sell Pressure. Updates in sync with every orderbook tick.

**Live Trade Feed**
Streams every taker-side trade in real time via the Pacifica WebSocket `trades` channel. Shows price, size, direction (buy/sell), and time elapsed since each trade. Maintains a rolling buffer of the 50 most recent trades.

**Funding Rates Panel**
Fetches all market prices via the `prices` WebSocket channel and displays them sorted by absolute funding rate. Lets traders instantly spot markets with the highest funding — useful for funding arbitrage or avoiding positions in high-rate markets. Clicking any row switches the active market.

**Price Chart**
REST-based candlestick chart using the `/api/v1/kline` endpoint. Supports 1m, 5m, 15m, 1h, and 4h intervals. Displays the last 60 candles with color coded by whether price is up or down over the period.

**Market Stats**
Shows current funding rate, predicted next funding rate, mid price, and oracle price for the selected market — all sourced from the `prices` WebSocket stream.

**Mainnet / Testnet Toggle**
Switch between `wss://ws.pacifica.fi/ws` and `wss://test-ws.pacifica.fi/ws` with one click. REST calls switch between `api.pacifica.fi` and `test-api.pacifica.fi` automatically.

---

## Pacifica API Usage

| Endpoint | Transport | Used For |
|---|---|---|
| `GET /api/v1/info` | REST | Load all available markets |
| `GET /api/v1/info/prices` | REST | Initial price snapshot |
| `GET /api/v1/book?symbol=X` | REST | Initial orderbook snapshot |
| `GET /api/v1/trades?symbol=X` | REST | Initial trade history |
| `GET /api/v1/kline?symbol=X&interval=Y` | REST | Price chart candlestick data |
| `source: "prices"` | WebSocket | Live prices, funding, OI for all markets |
| `source: "book"` | WebSocket | Live orderbook (100ms updates) |
| `source: "trades"` | WebSocket | Live trade stream |

WebSocket subscription format:
```json
{ "method": "subscribe", "params": { "source": "book", "symbol": "BTC", "agg_level": 1 } }
{ "method": "subscribe", "params": { "source": "trades", "symbol": "BTC" } }
{ "method": "subscribe", "params": { "source": "prices" } }
```

Heartbeat sent every 30s to keep the connection alive:
```json
{ "method": "ping" }
```

---

## Architecture

```
Browser
  │
  ├── WebSocket ──────────────────► wss://ws.pacifica.fi/ws
  │   (direct, no proxy needed)      └── book, trades, prices channels
  │
  └── REST fetch (/api/v1/...)
        │
        ▼
  Vercel Serverless Function (api/proxy.js)
        │
        ▼
  https://api.pacifica.fi/api/v1/...
```

REST calls go through a lightweight Vercel serverless proxy (`api/proxy.js`) to handle CORS — the browser cannot call `api.pacifica.fi` directly due to browser CORS restrictions. The proxy adds no latency overhead beyond standard Vercel edge routing.

WebSocket connects directly from the browser to `wss://ws.pacifica.fi/ws` — no proxy needed since browsers can open WSS connections to any origin natively.

---

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS — no framework, no build step
- **Charts:** Chart.js 4.4.1
- **Fonts:** IBM Plex Mono + Syne (Google Fonts)
- **Backend:** Vercel Serverless Function (Node.js) for REST proxy
- **Deployment:** Vercel

---

## Project Structure

```
pacifica-vercel/
├── vercel.json          # Routes /api/v1/* → serverless proxy
├── package.json
├── api/
│   └── proxy.js         # Serverless REST proxy with CORS headers
└── public/
    └── index.html       # Full dashboard (HTML + CSS + JS in one file)
```

---

## Running Locally

```bash
npm install -g vercel
vercel dev
```

Open `http://localhost:3000`. The proxy will forward REST calls to `api.pacifica.fi` and WebSocket connects directly from the browser.

To run against testnet:
```bash
USE_TESTNET=true vercel dev
```

---

## Track

**Analytics & Data** — Market intelligence dashboard providing real-time orderbook visualization, bid/ask pressure signals, and funding rate analytics across all Pacifica perpetual markets.

---

*Built during the Pacifica Hackathon, March–April 2026.*
