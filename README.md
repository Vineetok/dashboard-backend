## API FOR REGISTER

### POST /api/auth/register
```
{
  "name": "Rohit Sharma",
  "email": "rohit@example.com",
  "mobile": "9876543210",
  "pan": "ABCDE1234F",
  "city": "Delhi",
  "head": "Retail",
  "category": "Electronics",
  "password": "StrongPass123!",
  "confirm_password": "StrongPass123!"
}
```

- responsve
```
{
  "message": "Registration successful",
  "user": {
    "id": 1,
    "adv_id": "ADV_001",
    "name": "Rohit Sharma",
    "email": "rohit@example.com",
    "mobile": "9876543210"
  }
}

```

## API FOR LOGIN

#### POST /api/auth/login

```
{
  "identifier": "rohit@example.com",
  "password": "StrongPass123!"
}

```
- response 
```
{
  "message": "Login successful",
  "token": "<JWT_TOKEN>",
  "user": {
    "id": 1,
    "adv_id": "ADV_001",
    "name": "Rohit Sharma",
    "email": "rohit@example.com",
    "mobile": "9876543210"
  }
}

```