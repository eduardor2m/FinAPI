const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(express.json());

const costumers = [];

function verifyCostumerExists(req, res, next) {
  const { cpf } = req.headers;

  const customer = costumers.find((costumer) => costumer.cpf === cpf);

  if (!customer) {
    return res.status(400).json({ error: 'Customer not found' });
  }

  req.customer = customer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, item) => {
    if (item.type === 'deposit') {
      return acc + item.value;
    }

    return acc - item.value;
  }, 0);

  return balance;
}

app.post('/account', (req, res) => {
  const { cpf, name } = req.body;

  if (!cpf || !name) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const customerAlreadyExists = costumers.some(
    (costumer) => costumer.cpf === cpf
  );

  if (customerAlreadyExists) {
    return res.status(400).json({ error: 'Customer already exists' });
  }

  costumers.push({ id: uuidv4(), cpf, name, statement: [] });

  res.status(200).send({
    message: 'Account created',
  });
});

app.get('/statement', verifyCostumerExists, (req, res) => {

  const { customer } = req;

  res.status(200).json(customer.statement);

});

app.post('/deposit', verifyCostumerExists, (req, res) => {
  const { customer } = req;
  const { value, description } = req.body;
  
  if (!value) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  customer.statement.push({
    id: uuidv4(),
    type: 'deposit',
    created_at: new Date(),
    description,
    value,
  });

  console.log(customer);

  res.status(200).json({
    message: 'Deposit successful',
  });
});

app.post('/withdraw', verifyCostumerExists, (req, res) => {
  const { customer } = req;
  const { value, description } = req.body;

  if (!value) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const balance = getBalance(customer.statement);

  if (balance - value < 0) {
    return res.status(400).json({ error: 'Insufficient funds' });
  }

  customer.statement.push({
    id: uuidv4(),
    type: 'withdraw',
    created_at: new Date(),
    description,
    value,
  });

  res.status(200).json({
    message: 'Withdraw successful',
  });
});

app.get('/statement/date', verifyCostumerExists, (req, res) => {
  const { customer } = req;

  const { date } = req.query;

  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter((item) => {
    return item.created_at.toDateString() === new Date (dateFormat).toDateString();
  });

  res.status(200).json(statement);
});

app.put('/account', verifyCostumerExists, (req, res) => {
  const { customer } = req;
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  customer.name = name;

  res.status(200).json({
    message: 'Account updated',
  });
});

app.get('/account', verifyCostumerExists, (req, res) => {
  const { customer } = req;

  res.status(200).json(customer);
});

app.delete('/account', verifyCostumerExists, (req, res) => {
  const { customer } = req;

  const index = costumers.indexOf(customer);

  costumers.splice(index, 1);

  res.status(200).json({
    message: 'Account deleted',
  });
});

app.get('/balance', verifyCostumerExists, (req, res) => {
  const { customer } = req;
  
  const balance = getBalance(customer.statement);
  
  res.status(200).json({
    balance,
  });
});

app.get('/', (req, res) => {
  return res.json({
    message: 'Hello FinAPI',
  });
});

app.listen(3333, () => {
  console.log('Server is running on port 3000');
});