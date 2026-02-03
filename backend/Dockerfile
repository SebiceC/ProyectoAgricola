# Usamos Python 3.11 slim para mantener la imagen ligera y segura
FROM python:3.11-slim

# Evita archivos .pyc y logs en buffer
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Directorio de trabajo en el contenedor
WORKDIR /app

# Instalar dependencias del sistema necesarias para PostgreSQL y compilación
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements primero para aprovechar caché de Docker
COPY requirements.txt /app/

# Instalar dependencias
# Nota: Instalamos python-decouple y gunicorn por si no están en tu txt
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install python-decouple gunicorn psycopg2-binary


RUN useradd -m appuser

# Copiar el resto del código
COPY . /app/

RUN sed -i 's/\r$//g' /app/manage.py


RUN mkdir -p /app/staticfiles && \
    chown -R appuser:appuser /app/staticfiles && \
    chown -R appuser:appuser /app

# Cambiar al usuario seguro
USER appuser

# Exponer el puerto
EXPOSE 8000

# Comando por defecto (se sobrescribe en docker-compose para desarrollo)
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "backend.wsgi:application"]
