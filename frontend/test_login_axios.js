import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

// We need an admin token
api.post('/accounts/admin-login/', { username: 'ADMIN', password: 'password123' })
  .catch(err => {
    console.log("LOGIN ERR", err.message);
  });
