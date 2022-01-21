const express = require("express");
const { v4: uuidv4} = require("uuid");

const app = express();

const customers = [];

app.use(express.json())

// Middlewares
function verifyExistAccountCPF(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find(customer => customer.cpf === cpf);

  if(!customer) {
    return response.status(400).json({error: "Customer not found"})
  }

  request.customer = customer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if(operation.type === "credit") {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  },0)

  return balance;
}

app.get("/account", (request,response) => {
  return response.status(200).send(customers)
});

app.post("/account", (request,response) => {
    const {cpf, name} = request.body;

  const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf)

  if(customerAlreadyExists) {
    return response.status(400).send({error: "Customer already exists!"});
  }

  const customer = {
    cpf,
    name,
    id: uuidv4(),
    statement: []
  }

  customers.push(customer);
  return response.status(201).send(customer);
})


app.get("/statement",verifyExistAccountCPF, (request,response) => {
  const { customer } = request; 

  return response.json(customer.statement);
})

app.post("/deposit", verifyExistAccountCPF, (request, response) => {
  const { description, amount } = request.body;

  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit"
  }

  customer.statement.push(statementOperation);

  return response.status(201).send();
})

app.post("/withdraw",verifyExistAccountCPF, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;

  const balance = getBalance(customer.statement);

  if(balance  < amount) {
    return response.status(400).json({error: "Insufficient funds!"})
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit"
  }

  customer.statement.push(statementOperation);

  return response.status(201).send();
})


app.get("/statement/date",verifyExistAccountCPF, (request,response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter((sta) => {
    sta.created_at.toDateString() === new Date(dateFormat).toString()
  })

  return response.json(statement);
})

app.put("/account",verifyExistAccountCPF,(request, response) => {
  const { name } = request.body;
  const { customer } = request;

  customer.name = name;

  return response.status(201).send(customer);
})

app.get("/account",verifyExistAccountCPF,(request, response) => {
  const { cpf } = request;

  const getCustomer = customers.filter((customer) => customer.cpf === cpf)

  return response.json(getCustomer);
})

app.delete("/account", verifyExistAccountCPF, (request, response) => {
  const { customer } = request;

  customers.splice(customer,1);

  return response.status(200).json(customers);
})

app.get("/balance",verifyExistAccountCPF, (request, response) => {
  const { customer } = request;

  const balance = getBalance(customer.statement);

  return response.json(balance);
})



app.listen(3333)