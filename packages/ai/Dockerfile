FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY src/ src/

# Expose port
EXPOSE 8000

# Start the service
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
