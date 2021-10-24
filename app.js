const express = require("express");
const dotenv = require("dotenv");
const redis = require("redis");
const axios = require("axios");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Redis connect default port: 6379
const myRedis = redis.createClient();
myRedis.on("error", () => {
  console.log("Redis Connection failed");
});
myRedis.on("connect", (err, data) => {
  console.log("Redis connected");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is starting at http://localhost:${PORT}`);
});

app.get("/", (req, res) => {
  res.send(
    `<a href='http://localhost:3000/noredis'>No Redis</a> <br />
      <a href='http://localhost:3000/redis'>Redis</a> <br />
      <a href='http://localhost:3000/redis/clear'>Clear</a>`
  );
});

// Request with non caching
app.get("/noredis", (req, res) => {
  const username = req.query.username || "chainarong684";
  const url = `https://api.github.com/users/${username}`;

  axios
    .get(url)
    .then((result) => {
      res.json(result.data);
    })
    .catch((err) => {
      console.log(err);
    });
});

// Request with caching
app.get("/redis", (req, res) => {
  if (myRedis.connected) {
    myRedis.get("rdUsername", (err, data) => {
      if (err) {
        res.status(500).send({
          status: "bad",
          msg: err,
        });
        console.log(err);
      } else if (data) {
        const rdData = JSON.parse(data);
        console.log("Get Redis");
        res.status(200).send({
          status: "good",
          msg: rdData,
        });
      } else {
        const username = req.query.username || "chainarong684";
        const url = `https://api.github.com/users/${username}`;

        axios
          .get(url)
          .then((result) => {
            const fetchData = result.data;

            myRedis.set("rdUsername", JSON.stringify(fetchData), (err, data) => {
              if (err) {
                res.status(500).send({
                  status: "bad",
                  msg: err,
                });
              } else {
                res.status(200).send({
                  status: "good",
                  msg: fetchData,
                });
              }

              console.log("Set Redis");
            });
          })
          .catch((err) => {
            console.log(err);
          });
      }
    });
  }
});

// Clear all caching memories
app.get("/redis/clear", (req, res) => {
  myRedis.flushall((err, data) => {
    if (data) {
      res.status(200).send({
        status: "good",
        msg: "Successfuly clear all cache memories",
      });
    }
  });
});
