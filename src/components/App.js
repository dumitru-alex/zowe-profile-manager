import React, { useState, useEffect } from 'react';
import Container from 'react-bootstrap/Container';
import Table from 'react-bootstrap/Table';
import LogItem from '../components/LogItem';
import AddLogItem from '../components/AddLogItem';
import Alert from 'react-bootstrap/Alert';
import { ipcRenderer } from 'electron';

const App = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    ipcRenderer.send('logs:load');
    ipcRenderer.on('logs:get', (e, logs) => {
      setLogs(JSON.parse(logs));
    });
    ipcRenderer.on('logs:clear', () => {
      setLogs([]);
      showAlert('Logs Cleared');
    });
  }, []);

  function addItem(item) {
    if (item.text === '' || item.user === '' || item.priority === '') {
      showAlert('Please enter all fields', 'danger');
      return;
    }

    // item._id = Math.floor(Math.random() * 90000) + 10000;
    // item.created = new Date().toString();
    // setLogs([...logs, item]);
    ipcRenderer.send('logs:add', item);
    showAlert('Log Added');
  }

  function deleteItem(_id) {
    // setLogs(logs.filter(filter => filter._id !== _id));
    ipcRenderer.send('logs:delete', _id);
    showAlert('Log Removed');
  }

  function showAlert(message, variant = 'success', seconds = 3000) {
    setAlert({ show: true, message, variant });
    setTimeout(() => {
      setAlert({
        show: false,
        message: '',
        variant: 'success',
      });
    }, seconds);
  }

  const [alert, setAlert] = useState({
    show: false,
    message: '',
    variant: 'success',
  });
  return (
    <Container>
      <AddLogItem addItem={addItem} />
      {alert.show && <Alert variant={alert.variant}>{alert.message}</Alert>}
      <Table>
        <thead>
          <tr>
            <th>Priority</th>
            <th>Log Text</th>
            <th>User</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <LogItem key={log._id} log={log} deleteItem={deleteItem} />
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default App;
