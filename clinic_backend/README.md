# Multi-Clinic Appointment Platform Backend

Production-ready Django REST Framework backend for Multi-Clinic Appointment Platform.

## Quick Start

### 1. Activate Virtual Environment
```bash
# Windows
venv\Scripts\activate

# Linux/macOS
source venv/bin/activate
```

### 2. Run Database Migrations
```bash
python manage.py migrate
```

### 3. Run Development Server
```bash
python manage.py runserver
```

---

## Default Credentials

An initial superuser/admin account has been created for development and testing:

- **Role**: `ADMIN` (Superuser)
- **Email**: `admin@clinic.com`
- **Password**: `AdminPassword123!`

---

## API Documentation

Once the server is running, interactive API documentation is available at:

- **Swagger UI**: [http://127.0.0.1:8000/api/docs/](http://127.0.0.1:8000/api/docs/)
- **Redoc UI**: [http://127.0.0.1:8000/api/redoc/](http://127.0.0.1:8000/api/redoc/)
- **OpenAPI Schema**: [http://127.0.0.1:8000/api/schema/](http://127.0.0.1:8000/api/schema/)

---

## Running Tests

```bash
python manage.py test apps.core.tests apps.accounts.tests apps.clinics.tests apps.doctors.tests apps.appointments.tests
```
