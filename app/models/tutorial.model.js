const { Redis } = require("ioredis");
const sql = require("./db.js");
var redis = new Redis({
  host: '172.233.110.158',
  port: 6379,
});

// constructor
const Tutorial = function (tutorial) {
  this.title = tutorial.title;
  this.description = tutorial.description;
  this.published = tutorial.published;
};

Tutorial.create = (newTutorial, result) => {
  sql.query("INSERT INTO tutorials SET ?", newTutorial, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }

    console.log("created tutorial: ", { id: res.insertId, ...newTutorial });
    result(null, { id: res.insertId, ...newTutorial });
  });
};
function delay(seconds) {
  const start = process.hrtime();

  while (true) {
    const [s, ns] = process.hrtime(start);
    if (s >= seconds) {
      break;
    }
  }
}
Tutorial.findById = (id, result) => {
  sql.query(`SELECT * FROM tutorials WHERE id = ${id}`, async (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }
    const tuto = await redis.get(`tuto${id}`);
    if (tuto) {
      console.log("from cache:", tuto);
      result(null, tuto);
      return;
    }
    if (res.rows) {
      console.log("found tutorial: ", res.rows);
      await redis.set(`tuto${id}`, JSON.stringify(res.rows));
      await redis.expire(`tuto${id}`, 10)
      result(null, res.rows);
      return;
    }
    // not found Tutorial with the id
    result({ kind: "not_found" }, null);
  });
};

Tutorial.getAll = async (title, result) => {
  let query = "SELECT * FROM tutorials";

  if (title) {
    query += ` WHERE title LIKE '%${title}%'`;
  }
  const tutos = await redis.get('tutos');
  if (tutos) {
    console.log(tutos);

    result(null, tutos);
    return;
  }
  sql.query(query, async (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }
    await redis.set('tutos', JSON.stringify(res.rows));
    result(null, res.rows);
  });
};

Tutorial.getAllPublished = result => {
  sql.query("SELECT * FROM tutorials WHERE published=true", (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    console.log("tutorials: ", res);
    result(null, res);
  });
};

Tutorial.updateById = (id, tutorial, result) => {
  sql.query(
    "UPDATE tutorials SET title = ?, description = ?, published = ? WHERE id = ?",
    [tutorial.title, tutorial.description, tutorial.published, id],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(null, err);
        return;
      }

      if (res.affectedRows == 0) {
        // not found Tutorial with the id
        result({ kind: "not_found" }, null);
        return;
      }

      console.log("updated tutorial: ", { id: id, ...tutorial });
      result(null, { id: id, ...tutorial });
    }
  );
};

Tutorial.remove = (id, result) => {
  sql.query("DELETE FROM tutorials WHERE id = ?", id, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    if (res.affectedRows == 0) {
      // not found Tutorial with the id
      result({ kind: "not_found" }, null);
      return;
    }

    console.log("deleted tutorial with id: ", id);
    result(null, res);
  });
};

Tutorial.removeAll = result => {
  sql.query("DELETE FROM tutorials", (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    console.log(`deleted ${res.affectedRows} tutorials`);
    result(null, res);
  });
};

module.exports = Tutorial;
