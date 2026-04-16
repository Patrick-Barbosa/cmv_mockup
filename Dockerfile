FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install dependencies first (layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend runtime source and Alembic assets used on startup
COPY backend ./backend
COPY alembic.ini ./alembic.ini
COPY alembic ./alembic

# Expose the port Koyeb will route traffic to
EXPOSE 8000

# Start the app — PORT can be overridden by Koyeb
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
