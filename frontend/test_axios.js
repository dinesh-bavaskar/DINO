import axios from 'axios';
import FormData from 'form-data';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

const form = new FormData();
form.append('test', 'value');

api.post('http://127.0.0.1:8001/test', form)
  .catch(err => {
    console.log(err.config.headers);
  });
