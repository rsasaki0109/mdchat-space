FROM python:3.12-slim

WORKDIR /repo

COPY apps/api/requirements.txt /repo/apps/api/requirements.txt
RUN pip install --no-cache-dir -r /repo/apps/api/requirements.txt

COPY apps/api /repo/apps/api

ENV PYTHONPATH=/repo/apps/api
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
