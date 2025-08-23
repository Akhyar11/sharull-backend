import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import Route from "./src/routes/api";

class Server {
  private app: Application;

  constructor() {
    this.app = express();
    this.config();
  }

  private config(): void {
    dotenv.config();
    this.app.use(cors());
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ limit: "10mb", extended: true }));

    this.app.use("/api", Route);
  }

  public start(): void {
    const PORT = process.env.PORT || 3000;
    this.app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  }

  public getApp(): Application {
    return this.app;
  }
}

const server = new Server();
server.start();
