# ── Stage: runtime ────────────────────────────────────────────────────────────
FROM python:3.12-slim

# Prevent .pyc files and enable unbuffered stdout/stderr (visible in docker logs)
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies required by some Python packages (e.g. bcrypt)
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (cached layer unless requirements.txt changes)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY app/ ./app/

# Uploaded files are stored under /app/uploads — expose as a named volume
# so data persists across container restarts.
RUN mkdir -p /app/uploads
VOLUME ["/app/uploads"]

EXPOSE 8000

# Run with Uvicorn; bind to 0.0.0.0 so Docker port-mapping works.
# --workers 1 keeps background-task embedding jobs thread-safe in a single process.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
