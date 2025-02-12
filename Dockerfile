FROM python:3.9-slim

WORKDIR /app

# Copy only backend requirements and install dependencies
COPY backend/requirements.txt .
RUN pip install -r requirements.txt

# Copy backend code
COPY backend/ .

# Command to run the application
CMD ["python", "-m", "app.main"]