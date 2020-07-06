const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const monk = require("monk");
const Filter = require("bad-words");
const rateLimit = require("express-rate-limit");
const app = express();
require("dotenv").config();

const db = monk(process.env.MONGO_URI || "localhost/meower"); // mongoDB database
const mews = db.get("mews"); // mongoDB collection
const filter = new Filter();

app.use(express.json());
app.use(morgan("dev"));
app.use(cors());
// app.use(
//   rateLimit({
//     windowMs: 30 * 1000,
//     max: 1,
//   })
// );

app.get("/", (req, res) => {
  res.json({
    message: "hello world",
  });
});

app.get("/v2/mews", (req, res, next) => {
  let { skip, limit, sort = "desc" } = req.query;
  skip = parseInt(skip) || 0;
  limit = parseInt(limit) || 5;

  skip = skip < 0 ? 0 : skip;
  limit = Math.min(50, Math.max(1, limit));

  Promise.all([
    mews.count(),
    mews.find(
      {},
      {
        skip,
        limit,
        sort: {
          created: sort === "desc" ? -1 : 1,
        },
      }
    ),
  ])
    .then(([total, mews]) => {
      res.json({
        mews,
        pagination: {
          total,
          skip,
          limit,
          remaining: total - (skip + limit),
          has_more: total - (skip + limit) > 0,
        },
      });
    })
    .catch(next);
});

app.get("/mews", (req, res) => {
  mews.find().then((mews) => {
    res.json(mews);
  });
});

function isValidMew(mew) {
  return (
    mew.name &&
    mew.name.toString().trim() !== "" &&
    mew.content &&
    mew.content.toString().trim() !== ""
  );
}

const createMew = (req, res) => {
  if (isValidMew(req.body)) {
    const mew = {
      name: filter.clean(req.body.name.toString()),
      content: filter.clean(req.body.content.toString()),
      created: new Date(),
    };
    mews.insert(mew).then((createdMew) => {
      res.json(createdMew);
    });
  } else {
    res.status(422);
    res.json({
      message: "Hey! Name and Content are required",
    });
  }
};

app.post("/", createMew);
app.post("/v2/", createMew);

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`Server listenning on http://localhost:${port}`)
);
