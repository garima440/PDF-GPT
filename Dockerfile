FROM python:3.9-slim

WORKDIR /app

# Install dependencies within a virtual environment
COPY backend/requirements.txt .
RUN python -m venv /venv && \
    /venv/bin/pip install --upgrade pip && \
    /venv/bin/pip install -r requirements.txt

# Copy backend code
COPY backend/ .

# Use the virtual environment for execution
ENV PATH="/venv/bin:$PATH"

# Command to run the application
CMD ["python", "-m", "app.main"]
