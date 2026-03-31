FROM python:3.11-alpine

# FreeTDS para pymssql + ferramentas de compilação de extensões C
RUN apk add --no-cache \
    freetds-dev \
    freetds \
    build-base \
    unixodbc-dev

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
