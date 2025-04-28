import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import Route from "./src/routes/api.ts";

class Server {
  private app: Application;

  constructor() {
    this.app = express();
    this.config();
  }

  private config(): void {
    dotenv.config();
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    this.app.get("/", this.defaultRoute);
    this.app.use("/api", Route);
  }

  public start(): void {
    const PORT = process.env.PORT || 3000;
    this.app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  }

  private defaultRoute(req: Request, res: Response) {
    res.json({ message: "Welcome to the API!, Sistem for KATS" });
  }

  public getApp(): Application {
    return this.app;
  }
}

// ✅ Ekspor Express app, bukan menjalankan server langsung
const server = new Server();
export default server.getApp();
