# Python 3.9 kullan
FROM python:3.9-slim

# Çalışma klasörünü ayarla
WORKDIR /app

# Kütüphaneleri kopyala ve yükle
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kodunu kopyala
COPY server.py .

# Gunicorn ile sunucuyu başlat (Flask'ın kendi sunucusu prodüksiyon için zayıftır)
# Google Cloud Run otomatik olarak PORT değişkenini atar
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 server:app