const express = require("express");
const dateMethod = require("date-fns");
const isValid = require("date-fns/isValid");
const app = express();
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

// API 1

const checkStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const checkPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const checkCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const checkStatusAndPriority = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};

const checkStatusAndCategory = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.category !== undefined
  );
};

const checkCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const responseObj = (obj) => {
  return {
    id: obj.id,
    todo: obj.todo,
    priority: obj.priority,
    status: obj.status,
    category: obj.category,
    dueDate: obj.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  const { search_q = "", status, priority, category } = request.query;

  const requestQuery = request.query;
  let dbQuery;
  let dbResponse;

  switch (true) {
    case checkStatusAndPriority(requestQuery):
      if (
        ["TO DO", "IN PROGRESS", "DONE"].some((eachItem) => eachItem === status)
      ) {
        if (
          ["HIGH", "MEDIUM", "LOW"].some((eachItem) => eachItem === priority)
        ) {
          dbQuery = `select * from todo where status = '${status}' and priority='${priority}';`;
          dbResponse = await db.all(dbQuery);
          response.send(dbResponse.map((eachItem) => responseObj(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case checkStatusAndCategory(requestQuery):
      if (
        ["TO DO", "IN PROGRESS", "DONE"].some((eachItem) => eachItem === status)
      ) {
        if (
          ["WORK", "HOME", "LEARNING"].some((eachItem) => eachItem === category)
        ) {
          dbQuery = `select * from todo where status = '${status}' and category='${category}';`;
          dbResponse = await db.all(dbQuery);
          response.send(dbResponse.map((eachItem) => responseObj(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case checkCategoryAndPriority(requestQuery):
      if (["HIGH", "LOW", "MEDIUM"].some((eachItem) => eachItem === priority)) {
        if (
          ["WORK", "HOME", "LEARNING"].some((eachItem) => eachItem === category)
        ) {
          dbQuery = `select * from todo where priority = '${priority}' and category='${category}';`;
          dbResponse = await db.all(dbQuery);
          response.send(dbResponse.map((eachItem) => responseObj(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case checkStatusProperty(requestQuery):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        dbQuery = `select * from todo where status = '${status}';`;
        dbResponse = await db.all(dbQuery);
        response.send(dbResponse.map((eachItem) => responseObj(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case checkPriorityProperty(requestQuery):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        dbQuery = `select * from todo where priority = '${priority}';`;
        dbResponse = await db.all(dbQuery);
        response.send(dbResponse.map((eachItem) => responseObj(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case checkCategoryProperty(requestQuery):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        dbQuery = `select * from todo where category = '${category}';`;
        dbResponse = await db.all(dbQuery);
        response.send(dbResponse.map((eachItem) => responseObj(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    default:
      getTodoQuery = `
       SELECT
        *
       FROM 
        todo
       WHERE 
        todo LIKE '%${search_q}%';`;
      const data = await db.all(getTodoQuery);
      response.send(data.map((eachItem) => responseObj(eachItem)));
  }
});

/// API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const dbQuery = `select * from todo where id ='${todoId}';`;
  const dbResponse = await db.get(dbQuery);
  response.send(responseObj(dbResponse));
});

/// API 3

const checkValidDate = (date) => {
  const splitDate = date.split("-");
  const intDate = splitDate.map((e) => parseInt(e));
  const [y, m, d] = intDate;

  try {
    if (m <= 12 && m >= 1 && d <= 31 && d >= 1) {
      const result = isValid(new Date(y, m, d));
      return result;
    } else {
      return false;
    }
  } catch (e) {
    return false;
  }
};

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;

  const res = checkValidDate(date);

  if (res) {
    const formattedDate = dateMethod.format(new Date(date), "yyyy-MM-dd");
    const getDateQuery = `select * from todo where due_date = '${formattedDate}';`;

    const dbResponse = await db.all(getDateQuery);
    response.send(dbResponse.map((eachItem) => responseObj(eachItem)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

/// API 4

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (["HIGH", "MEDIUM", "LOW"].some((eachItem) => eachItem === priority)) {
    if (
      ["TO DO", "IN PROGRESS", "DONE"].some((eachItem) => eachItem == status)
    ) {
      if (
        ["WORK", "HOME", "LEARNING"].some((eachItem) => eachItem === category)
      ) {
        const result = checkValidDate(dueDate);
        if (result) {
          const formattedDate = dateMethod.format(
            new Date(dueDate),
            "yyyy-MM-dd"
          );
          const createDbQuery = `insert into todo (id,todo,priority,status,category,due_date ) values('${id}','${todo}','${priority}','${status}','${category}','${formattedDate}');`;
          const dbResponse = await db.run(createDbQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

/// API 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { todo, priority, status, category, dueDate } = request.body;
  const requestBody = request.body;

  let updateQuery;
  let dbResponse;

  if (todo !== undefined) {
    updateQuery = `update todo set todo = '${todo}' where id='${todoId}';`;
    dbResponse = await db.run(updateQuery);
    response.send("Todo Updated");
  } else if (priority !== undefined) {
    if (["HIGH", "MEDIUM", "LOW"].some((eachItem) => eachItem === priority)) {
      updateQuery = `update todo set priority = '${priority}' where id='${todoId}';`;
      dbResponse = await db.run(updateQuery);
      response.send("Priority Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else if (status !== undefined) {
    if (
      ["TO DO", "IN PROGRESS", "DONE"].some((eachItem) => eachItem == status)
    ) {
      updateQuery = `update todo set status = '${status}' where id='${todoId}';`;
      dbResponse = await db.run(updateQuery);
      response.send("Status Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (category !== undefined) {
    if (
      ["WORK", "HOME", "LEARNING"].some((eachItem) => eachItem === category)
    ) {
      updateQuery = `update todo set category = '${category}' where id='${todoId}';`;
      dbResponse = await db.run(updateQuery);
      response.send("Category Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else {
    const answer = checkValidDate(dueDate);

    if (answer) {
      const formattedDate = dateMethod.format(new Date(dueDate), "yyyy-MM-dd");
      updateQuery = `update todo set due_date = '${formattedDate}' where id='${todoId}';`;
      await db.run(updateQuery);
      response.send("Due Date Updated");
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

/// API 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `delete from todo where id = '${todoId}'`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
