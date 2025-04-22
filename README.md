# 🧠 Database AI Agent

An intelligent AI-powered assistant that connects to your PostgreSQL database and lets you query your data using plain English. Designed for non-technical users, analysts, product managers, and startup teams who want instant insights without writing a single line of SQL.

> "What were our top-selling products last month?"  
> → Instantly get the answer, backed by real-time SQL generated and executed on your database.

---

## 🚀 Features

- 🔗 Secure connection to PostgreSQL databases
- 💬 Natural language to SQL via Ollama (or OpenAI)
- 🧠 Context-aware query generation with schema understanding
- 🪄 Clean UI for chat-based querying and result display
- 📥 Export results to CSV
- 🧾 Query history & saved queries (coming soon)
- 🔐 Auth & access control (coming soon)

---

## 🛠️ Tech Stack

### 💻 Frontend
- **Next.js** - website design
- **Tailwind CSS** - styling

### Backend
- **FastAPI** — modern, async Python web framework
- **SQLAlchemy** — ORM + schema introspection
- **asyncpg** — fast PostgreSQL driver for async queries

### 🧠 AI Layer
- **Ollama** (local LLM) or **OpenAI API** (fallback)
- Prompt-engineered for SQL generation
- Schema-aware embeddings (planned)

### 🛡️ DevOps & Auth
- **JWT**-based auth (Clerk/NextAuth planned)
- **Docker** for local development
- **Stripe** for payment integration (roadmap)

---

## 🗺️ Roadmap

### ✅ MVP (April 2025)
- [x] FastAPI backend with PostgreSQL connection
- [x] Natural language to SQL via LLM
- [ ] Query result viewer
- [ ] Export results to CSV


### 🔜 Near-Term Goals (May 2025)
- [ ] Query history (titles + timestamps)
- [ ] Chat interface for input/output
- [ ] User auth (JWT or Clerk/NextAuth)
- [ ] Usage-based or subscription pricing (Stripe)

### 🧠 Future Plans
- [ ] Team accounts with shared queries
- [ ] Slack/Discord bot integrations
- [ ] Self-hosting + Docker image
- [ ] Multi-DB support: MySQL, SQLite, Snowflake
- [ ] Vector search for schema-aware context

---

## 🧪 Local Development

```bash
# 1. Clone the repo
git clone https://github.com/your-username/db-ai-agent.git
cd db-ai-agent

# 2. Set up Python backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 3. Start FastAPI backend
uvicorn main:app --reload

# 4. Start Ollama server
ollama serve
```

For now, you have to manually install what LLM you want to use, then change the main.py file to choose that model.

The ports I'm using are as follows:
 - Ollama : 11434
 - PostgresSQL : 5432
 - local API : 8000

If you are having conflicts with these ports feel free to change them

## 📝 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for full update history.

