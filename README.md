# ssl-gen

Interactive CLI tool to generate trusted SSL certificates using [acme.sh](https://acme.sh) via ZeroSSL DNS-01 challenge. Designed for use with GoDaddy hosting (or any host where you upload certs manually via cPanel).

## Prerequisites

- **Node.js** 18+
- **acme.sh** installed on your machine

```bash
curl https://get.acme.sh | sh -s email=you@example.com
```

## Installation

```bash
git clone https://github.com/rajanvijayan/ssl-gen.git
cd ssl-gen
npm install
npm install -g .
```

## Usage

```bash
# Generate SSL for domain + www (default)
ssl-gen generate example.com

# Generate SSL for domain only (no www)
ssl-gen generate example.com --skip-www

# Force-renew an existing certificate
ssl-gen regenerate example.com
ssl-gen regenerate example.com --skip-www
```

## How It Works

1. Requests DNS-01 challenge TXT records from ZeroSSL via acme.sh
2. Displays the TXT records to add to your DNS provider
3. Waits for you to press Enter after adding them
4. Polls DNS propagation every 10 seconds (timeout: 5 minutes)
5. Finalizes and issues the certificate once DNS is verified
6. Displays the **CRT**, **Private Key**, and **CA Bundle** — ready to paste into cPanel

## Uploading to GoDaddy cPanel

1. cPanel → **Security** → **SSL/TLS** → **Manage SSL Sites**
2. Select your domain
3. Paste the outputs:
   - **Certificate (CRT)** → CRT box
   - **Private Key** → KEY box
   - **CA Bundle** → CABUNDLE box
4. Click **Install Certificate**

## Certificate Renewal

Certificates are valid for **90 days**. To renew:

```bash
ssl-gen regenerate example.com
```

## Project Structure

```
ssl-gen/
├── bin/ssl-gen.js              # CLI entry point
├── src/
│   ├── commands/
│   │   ├── generate.js         # generate command
│   │   ├── regenerate.js       # regenerate command
│   │   └── shared.js           # orchestration flow
│   ├── lib/
│   │   ├── acme.js             # acme.sh runner + TXT record parser
│   │   ├── dns.js              # DNS propagation poller
│   │   └── certs.js            # certificate file reader
│   └── utils/
│       ├── config.js           # path and timing constants
│       ├── output.js           # terminal display helpers
│       └── prompt.js           # readline Enter-to-continue
└── package.json
```

## License

MIT
