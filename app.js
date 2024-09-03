const { format, parseISO } = require("date-fns");
const express = require("express");
const { open } = require("sqlite");
const sqlite = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const dbToServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite.Database,
    });
    app.listen(3000, () => {
      console.log("server successfully running at :http://localhost:3000/");
    });
  } catch (e) {
    console.log(`db Error: ${e.message}`);
  }
};
dbToServer();

const checkPriorityAndStatus = (request) => {
  return request.priority !== undefined && request.status !== undefined;
};
const checkCategoryAndStatus = (request) => {
  return request.category !== undefined && request.status !== undefined;
};
const checkCategoryAndPriority = (request) => {
  return request.category !== undefined && request.priority !== undefined;
};
const checkCategory = (request) => {
  return request.category !== undefined;
};

const checkStatus = (request) => {
  return request.status !== undefined;
};
const checkPriority = (request) => {
  return request.priority !== undefined;
};

app.get("/todos/", async (request, response) => {
  let dbResponse = null;
  const { search_q = "", priority, status, category } = request.query;
  const allPriority = ["HIGH", "MEDIUM", "LOW"];
  const allStatus = ["TO DO", "IN PROGRESS", "DONE"];
  const allCategory = ["WORK", "HOME", "LEARNING"];
  const search = [];
  switch (true) {
    case checkPriorityAndStatus(request.query):
      if (allPriority.includes(priority)) {
        if (allStatus.includes(status)) {
          const getPriorityAndStatus = `
            SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE priority ='${priority}' AND status = '${status}';`;
          dbResponse = await db.all(getPriorityAndStatus);
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;
    case checkCategoryAndStatus(request.query):
      if (allCategory.includes(category)) {
        if (allStatus.includes(status)) {
          const getCategoryAndStatus = `
            SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE category ='${category}' AND status = '${status}';`;
          dbResponse = await db.all(getCategoryAndStatus);
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;
    case checkCategoryAndPriority(request.query):
      if (allCategory.includes(category)) {
        if (allPriority.includes(priority)) {
          const getCategoryAndPriority = `
            SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE category ='${category}' AND priority = '${priority}';`;
          dbResponse = await db.all(getCategoryAndPriority);
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;
    case checkStatus(request.query):
      if (allStatus.includes(status)) {
        const getStatus = `
            SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE status = '${status}';`;
        dbResponse = await db.all(getStatus);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case checkPriority(request.query):
      if (allPriority.includes(priority)) {
        const getPriority = `
            SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE priority = '${priority}';`;
        dbResponse = await db.all(getPriority);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;
    case checkCategory(request.query):
      if (allCategory.includes(category)) {
        const getCategory = `
            SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE category = '${category}';`;
        dbResponse = await db.all(getCategory);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    default:
      const getQueryBySearch = `
            SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE todo LIKE '%${search_q}%';`;
      dbResponse = await db.all(getQueryBySearch);

      break;
  }
  response.send(dbResponse);
});

// specific todo

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodo = `
    SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE id = ${todoId};`;
  const dbResponse = await db.get(getTodo);
  response.send(dbResponse);
});
/// date
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (date == undefined) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const newDate = new Date(date);
    const formattedDate = format(newDate, "yyyy-MM-dd");
    const getDate = `
    SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE due_date = '${formattedDate}';`;
    const dbResponse = await db.get(getDate);
    response.send(dbResponse);
  }
});

// post

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status, category, dueDate } = todoDetails;

  const getDbQuery = `
    INSERT INTO 
    todo 
    (
        id,
        todo,
        priority,
        status,
        category,
        due_date
    )
    VALUES 
    (
        ${id},
        '${todo}',
        '${priority}',
        '${status}',
        '${category}',
        '${dueDate}'
    );`;

  const dbResponse = await db.run(getDbQuery);
  response.send("Todo Successfully Added");
});
// put
app.put("/todos/:todoId/", async (request, response) => {
  const { todo, category, priority, status, dueDate } = request.body;
  const { todoId } = request.params;
  if (status !== undefined) {
    const UpdateSql = `
    UPDATE 
    todo
    SET 
     status = '${status}'
     WHERE 
     id = ${todoId};`;

    await db.run(UpdateSql);
    response.send("Status Updated");
  } else if (dueDate !== undefined) {
    const UpdateSql = `
    UPDATE 
    todo
    SET 
     due_date = '${dueDate}'
     WHERE 
     id = ${todoId};`;

    await db.run(UpdateSql);
    response.send("Due Date Updated");
  } else if (category !== undefined) {
    const UpdateSql = `
    UPDATE 
    todo
    SET 
     category = '${category}'
     WHERE 
     id = ${todoId};`;

    await db.run(UpdateSql);
    response.send("Category Updated");
  } else if (priority !== undefined) {
    const UpdateSql = `
    UPDATE 
    todo
    SET 
     priority = '${priority}'
     WHERE 
     id = ${todoId};`;

    await db.run(UpdateSql);
    response.send("Priority Updated");
  } else if (todo !== undefined) {
    const UpdateSql = `
    UPDATE 
    todo
    SET 
     todo = '${todo}'
     WHERE 
     id = ${todoId};`;

    await db.run(UpdateSql);
    response.send("Todo Updated");
  }
});

// delete

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteFromSql = `
    DELETE 
    FROM 
    todo
    WHERE 
    id = ${todoId};`;
  await db.run(deleteFromSql);
  response.send("Todo Deleted");
});

module.exports = app;
