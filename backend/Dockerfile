FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy schema and application source
COPY schema.sql .
COPY app ./app

# Listen dynamically on Cloud Run $PORT (defaults to 8000 for local dev)
ENV PORT=8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
