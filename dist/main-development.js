"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const api_ts_1 = __importDefault(require("./src/routes/api"));
class Server {
  constructor() {
    this.app = (0, express_1.default)();
    this.config();
  }
  config() {
    dotenv_1.default.config();
    this.app.use((0, cors_1.default)());
    this.app.use(express_1.default.json());
    this.app.use(express_1.default.urlencoded({ extended: true }));
    this.app.use("/api", api_ts_1.default);
  }
  start() {
    const PORT = process.env.PORT || 3000;
    this.app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  }
  getApp() {
    return this.app;
  }
}
const server = new Server();
server.start();
