import { Router, Request, Response } from "express";
import { userController } from "../controllers/usersController.ts";
import { authController } from "../controllers/adminAuthController.ts";
import { adminAuthMiddleware } from "../middlewares/adminMiddleware.ts";
import { packageController } from "../controllers/packagesController.ts";
import { bookingController } from "../controllers/bookingsControllers.ts";
import { paymentController } from "../controllers/paymentsControllers.ts";
import { invoiceController } from "../controllers/invoicesControllers.ts";
import { packageScheduleController } from "../controllers/packageSchedules.ts";
import { fleetController } from "../controllers/fleetsController.ts";

class Route {
  public router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get("/", this.defaultRoute);
    this.router.post("/login", authController.login);

    this.adminGroup();
  }

  private adminGroup() {
    const adminRouter = Router();
    adminRouter.use(adminAuthMiddleware);

    // Users
    adminRouter.get("/users/list", userController.list);
    adminRouter.post("/users", userController.store);
    adminRouter.put("/users/:id", userController.update);
    adminRouter.delete("/users/:id", userController.delete);

    // Packages
    adminRouter.get("/packages/list", packageController.list);
    adminRouter.post("/packages", packageController.store);
    adminRouter.put("/packages/:id", packageController.update);
    adminRouter.delete("/packages/:id", packageController.delete);

    // Fleets
    adminRouter.get("/fleets/list", fleetController.list);
    adminRouter.post("/fleets", fleetController.store);
    adminRouter.put("/fleets/:id", fleetController.update);
    adminRouter.delete("/fleets/:id", fleetController.delete);

    // Package Schedules
    adminRouter.get("/packagespackages/list", packageScheduleController.list);
    adminRouter.post("/packagespackages", packageScheduleController.store);
    adminRouter.put("/packagespackages/:id", packageScheduleController.update);
    adminRouter.delete(
      "/packagespackages/:id",
      packageScheduleController.delete
    );

    // Bookings
    adminRouter.get("/bookings/list", bookingController.list);
    adminRouter.post("/bookings", bookingController.store);
    adminRouter.put("/bookings/:id", bookingController.update);
    adminRouter.delete("/bookings/:id", bookingController.delete);

    // Payments
    adminRouter.get("/payments/list", paymentController.list);
    adminRouter.post("/payments", paymentController.store);
    adminRouter.put("/payments/:id", paymentController.update);
    adminRouter.delete("/payments/:id", paymentController.delete);

    // Invoices
    adminRouter.get("/invoices/list", invoiceController.list);
    adminRouter.post("/invoices", invoiceController.store);
    adminRouter.put("/invoices/:id", invoiceController.update);
    adminRouter.delete("/invoices/:id", invoiceController.delete);

    this.router.use("/admin", adminRouter);
  }

  private defaultRoute(req: Request, res: Response) {
    res.json({ message: "Welcome to the API!, Sistem for KATS" });
  }
}

export default new Route().router;
