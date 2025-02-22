import './App.css';
import React, { useEffect, useState } from 'react';
import api from './api';


function App() {

  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/message')
    .then((response) => {
      setMessage(response.data.message);
    })
    .catch((error) => {
      console.error('Error al obtener el mensaje:', error);
    });
  }, []);

  return (
    <div className="App">
      <h1>Frontend con React y Axios</h1>
      <p>{message}</p> 
    </div>
  );
}

export default App;
