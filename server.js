const path = require("path");
const dotenv = require('dotenv').config();
var cors = require('cors');
const express = require("express");
const { connect } = require('./app/database');
const category = require("./app/routes/category");
const { downloadFile } = require("./app/controllers/file");
const file = require("./app/routes/file");
const post = require("./app/routes/post");
const role = require("./app/routes/role");
const user = require("./app/routes/user");
const auth = require("./app/routes/auth");
const course = require("./app/routes/course");
const question = require("./app/routes/question");
const exam = require("./app/routes/exam");
const approval = require("./app/routes/approval");
const smsHistory = require("./app/routes/smsHistory");
const smsTemplate = require("./app/routes/smsTemplate");
const examSessions = require("./app/routes/examSessions");
const ticket = require("./app/routes/ticket");
const permission = require("./app/routes/permission");
const { getMainPartOfUrl } = require("./app/utils/general");
const { backUpService } = require('./app/services/backUp');
const { initSocketService } = require('./app/services/socketHandlers');
const { LogService } = require('./app/services/logger');
const { reloadJobs } = require('./app/utils/sms');
const { checkRoutePermission } = require("./app/middlewares/checkAuth");
const fileManager = require('./app/class/filemanager');
const { setApp } = require('./app/AppInstance');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

(async () => {
  const app = await express();
  const http = require('http');
  const server = http.createServer(app);
  setApp(app);
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
  // config();

  //* BodyPaser
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  

  app.use(cors());

  //* Static Folder
  app.use(express.static(path.join(__dirname, "app", "public")));
  app.use(upload.single('file'));

  //* Routes
  app.use("/auth", auth);
  app.get('/file/:file_id/:token', downloadFile);
  app.use(checkRoutePermission);
  app.use("/file", file);
  app.use("/user", user);
  app.use("/role", role);
  app.use("/permission", permission);
  app.use("/category", category);
  app.use("/post", post);
  app.use("/course", course);
  app.use("/approval", approval);
  app.use("/smsTemplate", smsTemplate);
  app.use("/smsHistory", smsHistory);
  app.use("/ticket", ticket);
  app.use("/question", question);
  app.use("/exam", exam);
  app.use("/examSessions", examSessions);

  //* 404 Page
  // app.use(require("./controllers/errorController").get404);

  //* Database connection
  await connect(app);

  // FileManager init 
  fileManager.getInstance().initialize();


  const PORT = process.env.PORT || 3000;

  server.listen(PORT, () => {
    // backUpService();
    LogService();
    reloadJobs();
    global.io = io;
    initSocketService();
    console.log(`Server running on port : ${PORT}`);
  });
})();

