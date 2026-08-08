# DiscoverAI — GitHub Setup & Deployment Guide

## 📋 Prerequisites

- **Python** >= 3.10 (recommended: 3.14)
- **Node.js** >= 18.0
- **npm** >= 9.0
- **Git** >= 2.30

---

## 🔧 Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/discoverai.git
cd discoverai
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
python app/main.py
# OR with uvicorn directly:
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend will be available at:
- API: `http://localhost:8000`
- Docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/`

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### 4. Verify Setup
```bash
# Backend health check
curl http://localhost:8000/

# Frontend build
cd frontend
npm run build
npm run preview
```

---

## 🐳 Docker Deployment (Optional)

### Backend Dockerfile
```dockerfile
FROM python:3.14-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - PYTHONUNBUFFERED=1
    volumes:
      - ./backend:/app
    
  frontend:
    build: ./frontend
    ports:
      - "5173:80"
    depends_on:
      - backend
```

Run:
```bash
docker-compose up --build
```

---

## ☁️ Cloud Deployment

### Backend: Render / Railway / Fly.io
```bash
# Build command
pip install -r requirements.txt

# Start command
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend: Vercel / Netlify
```bash
# Build command
npm run build

# Output directory
dist/
```

---

## 🔑 Environment Variables

### Backend (.env)
```env
PROJECT_NAME=DiscoverAI Engine
VERSION=2.5.0
API_V1_STR=/api/v1
SECRET_KEY=your-secret-key-here
BACKEND_CORS_ORIGINS=["http://localhost:5173", "https://your-domain.com"]
EMBEDDING_DIM=512
TOP_K_DEFAULT=12
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm run lint
npm run build
```

---

## 📊 Production Checklist

- [ ] Set `SECRET_KEY` to a strong random value
- [ ] Configure `BACKEND_CORS_ORIGINS` for production domain
- [ ] Enable HTTPS (use `uvicorn` behind Nginx or cloud load balancer)
- [ ] Set up Redis for session storage (replace in-memory session manager)
- [ ] Migrate vector index to FAISS or Pinecone for scale
- [ ] Add API rate limiting (e.g., `slowapi`)
- [ ] Set up monitoring (Prometheus + Grafana or Datadog)
- [ ] Configure log aggregation (ELK or CloudWatch)
- [ ] Add CI/CD pipeline (GitHub Actions)
- [ ] Set up database for persistent user profiles (PostgreSQL)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **H&M Personalized Fashion Recommendations** — Dataset inspiration for sequential purchase prediction
- **Amazon Product Reviews** — Co-purchase graph and review data for GNN modeling
- **Instacart Market Basket** — Session-based intent and cart sequence data
- **Coveo E-Commerce Intent** — Session search interaction patterns

Built with ❤️ for International AI Hackathons
