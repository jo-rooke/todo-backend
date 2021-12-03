import express from "express";
import cors from "cors";
import dotenv from "dotenv";

const app = express();

/** Parses JSON data in a request automatically */
app.use(express.json());
/** To allow 'Cross-Origin Resource Sharing': https://en.wikipedia.org/wiki/Cross-origin_resource_sharing */
app.use(cors());

// read in contents of any environment variables in the .env file
dotenv.config();

// use the environment variable PORT, or 4000 as a fallback
const PORT_NUMBER = process.env.PORT ?? 4000;

if (!process.env.DATABASE_URL) {
  throw "No DATABASE_URL env var!  Have you made a  your.env file?  And set up dotenv?";
}

import { Client } from "pg";

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

client.connect();

app.post("/todos", async (req, res) => {
  try {
    const { description, due_date } = req.body;
    const newTodo = await client.query(
      "insert into todo (description, due_date, completed_status) values ($1, $2, false)",
      [`${description}`, `%${due_date}%`]
    );
    res.json(newTodo.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});
// - seeing all todos
app.get("/todos", async (req, res) => {
  try {
    const allTodos = await client.query(
      "select * from todo order by creation_date"
    );
    res.json(allTodos.rows);
  } catch (err) {
    console.error(err.message);
  }
});
// - editing todos
app.put("/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;
    const updateTodo = await client.query(
      "update todo set description = $1 where id = $2",
      [description, id]
    );
    res.json(updateTodo.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});
// - Mark todos as 'complete'
app.put("/todos/completed/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { completed_status } = req.body;
    const setCompleted = await client.query(
      "update todo set completed_status = $1 where id = $2",
      [completed_status, id]
    );
    res.json(setCompleted.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});
// - Deleting todos
app.delete("/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleteItem = await client.query("delete from todo where id = $1", [
      id,
    ]);
    res.json("to do deleted");
  } catch (err) {
    console.error(err.message);
  }
});
// - Sorting todos by creation date --- TIMEOUT
app.get("/todos/newest", async (req, res) => {
  try {
    const newestTodos = await client.query(
      "select * from todos order by creation_date desc"
    );
    res.json(newestTodos.rows);
  } catch (err) {
    console.error(err.message);
  }
});
// - Filtering overdue todos --- TIMEOUT
app.get("/todos/overdue", async (req, res) => {
  try {
    const overdueTodos = await client.query(
      "select * from todos order by creation_date where due_date < current_date"
    );
    res.json(overdueTodos.rows);
  } catch (err) {
    console.error(err.message);
  }
});

app.listen(5000, () => {
  console.log("Server has started listening on Port 5000");
});
