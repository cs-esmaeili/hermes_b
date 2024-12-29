const path = require("path");
const dotenv = require('dotenv').config();
var cors = require('cors');
const fileUpload = require("express-fileupload");
const express = require("express");
const { connect } = require('./app/database');
const category = require("./app/routes/category");
const file = require("./app/routes/file");
const post = require("./app/routes/post");
const role = require("./app/routes/role");
const user = require("./app/routes/user");
const smsHistory = require("./app/routes/smsHistory");
const smsTemplate = require("./app/routes/smsTemplate");
const product = require("./app/routes/product");
const { logInStepOne, logInStepTwo } = require("./app/controllers/user");
const permission = require("./app/routes/permission");
const { config } = require("./app/utils/sms");
const { getMainPartOfUrl } = require("./app/utils/general");
const { backUpService } = require('./app/services/backUp');
const { initSocketService } = require('./app/services/socketHandlers');
const { LogService } = require('./app/services/logger');
const { reloadJobs } = require('./app/utils/sms');

const { checkRoutePermission } = require("./app/middlewares/checkAuth");

(async () => {
  const app = await express();
  const http = require('http');
  const server = http.createServer(app);

  const { Server } = require("socket.io");

  const allowedOrigins = [process.env.FRONTEND_URL, process.env.BASE_URL];

  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        try {
          const baseUrl = getMainPartOfUrl(origin);
          for (let i = 0; i < allowedOrigins.length; i++) {
            const allowOrigin = allowedOrigins[i];
            const baseOrigin = getMainPartOfUrl(allowOrigin);
            if (baseOrigin == baseUrl) {
              callback(null, true);
              return;
            }
          }
          callback(new Error('Not allowed by CORS'));
        } catch (error) {
          console.log("error in origins : " + error);
        }
      }
    },
  });



  //SMS config
  config();

  //* BodyPaser
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  //* File Upload Middleware
  app.use(fileUpload());


  app.use(cors());

  //* Static Folder
  app.use(express.static(path.join(__dirname, "app", "public")));


  //* Routes
  app.use(checkRoutePermission);
  app.use("/logInStepOne", logInStepOne);
  app.use("/logInStepTwo", logInStepTwo);

  app.use("/user", user);
  app.use("/role", role);
  app.use("/permission", permission);
  app.use("/category", category);
  app.use("/post", post);
  app.use("/file", file);
  app.use("/product", product);
  app.use("/smsTemplate", smsTemplate);
  app.use("/smsHistory", smsHistory);

  //* 404 Page
  // app.use(require("./controllers/errorController").get404);

  //* Database connection
  await connect(app);

  const PORT = process.env.PORT || 3000;

  server.listen(PORT, () => {
    console.log(`Server running on port : ${PORT}`);

    backUpService();
    LogService();
    reloadJobs();
    global.io = io;
    initSocketService();

  });
})();

