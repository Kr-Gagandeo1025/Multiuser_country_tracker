import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "gagan1234",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

let users = [];

async function getUsers(){
  const user_res = await db.query("SELECT * FROM users");
  users = user_res.rows;
  console.log(users);
  return users.find((user)=> user.id == currentUserId);
}

async function checkVisisted() {
  const result = await db.query("SELECT country_id FROM visited_country where user_id = $1",[currentUserId]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_id);
  });
  // console.log(countries);
  return countries;
}
app.get("/", async (req, res) => {
  const currentUser = await getUsers();
  const countries = await checkVisisted();
  console.log(currentUser,countries);
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: currentUser.color,
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) = $1 ",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_country (country_id, user_id) VALUES ($1,$2);",
        [countryCode, currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
      res.redirect("/");
    }
  } catch (err) {
    console.log(err);
    res.redirect("/");
  }
});
app.post("/user", async (req, res) => {
  if(req.body.add === "new"){
    res.render("new.ejs");
  }else{
    currentUserId = req.body.user;
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
  let name = req.body.name;
  let color = req.body.color;
  console.log(name,color);
  try{
    const result = await db.query(
      "INSERT INTO users (name,color) values ($1,$2) returning *;",
      [name,color]
    );
    const id = result.rows[0].id;
    currentUserId = id;
    res.redirect("/");
  }catch(err){
    console.log(err);
    res.redirect("/");
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
