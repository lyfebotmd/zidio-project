# Project LOOP - AI-Driven Customer Feedback Intelligence

Project LOOP is a modern, multi-tenant customer feedback platform built to ingest customer comments, run automated sentiment analysis, extract key operational themes, and generate concise summaries using Anthropic's Claude 3.5 Sonnet.

---

## 🚀 Features

- **Multi-Tenant Architecture**: Isolated workspace environments powered by NextAuth.js session context and Neon PostgreSQL.
- **Bulk & Single Ingestion**: Submit individual feedback comments manually or upload bulk feedback datasets using `.csv` files parsed via `PapaParse`.
- **Automated AI Processing**: Integrates Anthropic Claude 3.5 Sonnet to score sentiment (`POSITIVE`, `NEGATIVE`, `NEUTRAL`), extract up to 3 key themes, and summarize feedback in real-time.
- **Visual Feedback Directory**: Status badges and feedback cards displaying raw input alongside AI insights.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Database**: [Neon PostgreSQL](https://neon.tech/)
- **ORM**: [Prisma 5.22](https://www.prisma.io/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **AI Processing**: [Anthropic Claude API (Claude 3.5 Sonnet)](https://www.anthropic.com/)
- **CSV Parser**: [PapaParse](https://www.papaparse.com/)

---

## 📂 Project Structure

```text
project-loop/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth session configuration
│   │   ├── feedback/
│   │   │   ├── route.ts                 # Fetch & post single feedback entries
│   │   │   ├── bulk/route.ts            # CSV bulk ingestion endpoint
│   │   │   └── analyze/route.ts         # Claude AI analysis engine endpoint
│   ├── dashboard/
│   │   ├── page.tsx                     # Main customer feedback dashboard UI
│   │   └── FeedbackCharts.tsx           # Visual analytics components
│   └── providers.tsx                    # NextAuth Provider wrapper
├── lib/
│   ├── ai.ts                            # Claude 3.5 Sonnet prompt engine & parser
│   ├── anthropic.ts                     # Anthropic SDK client setup
│   └── prisma.ts                        # Singleton Prisma client instance
├── prisma/
│   ├── schema.prisma                    # Database schema definitions
│   └── seed.ts                          # Database seed script for workspace/admin
├── .env.example                         # Environment configuration template
└── README.md