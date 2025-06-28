import { Router } from "express";
import { userController } from "../controllers/usersController";
import { authController as adminAuthController } from "../controllers/adminAuthController";
import { authController } from "../controllers/authController";
import { adminAuthMiddleware } from "../middlewares/adminMiddleware";
import { packageController } from "../controllers/packagesController";
import { bookingController } from "../controllers/bookingsControllers";
import { paymentController } from "../controllers/paymentsControllers";
import { invoiceController } from "../controllers/invoicesControllers";
import { packageScheduleController } from "../controllers/packageSchedules";
import { fleetController } from "../controllers/fleetsController";
import { imageController } from "../controllers/imageController";
import { destinationController } from "../controllers/destinationController";
import { paymentMethodController } from "../controllers/paymentMetodeController";
import { userAuthMiddleware } from "../middlewares/userMiddleware";

class Route {
  public router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post("/login", adminAuthController.login);
    this.router.post("/register", authController.register);
    this.router.get("/file-proxy/:id", imageController.listById);
    this.router.get("/file-proxy/fk/:id", imageController.listByFK);
    this.router.get(
      "/file-proxy/fk/singel/:id",
      imageController.listByFKSingel
    );

    this.userGroup();
    this.adminGroup();
  }

  private userGroup() {
    const userRouter = Router();
    userRouter.use(userAuthMiddleware);

    // Profile
    userRouter.get("/profile", userController.profile);
    userRouter.put("/profile", userController.update);

    // Packages
    userRouter.get("/packages", packageController.listForUser);
    userRouter.get("/packages/:id", packageController.detailForUser);

    // Package Schedules
    userRouter.get(
      "/packages/:packageId/schedules",
      packageScheduleController.listForUser
    );
    userRouter.get("/schedules/:id", packageScheduleController.detailForUser);

    // Bookings
    userRouter.get("/bookings", bookingController.listForUser);
    userRouter.get("/bookings/:id", bookingController.detailForUser);
    userRouter.post("/bookings", bookingController.createForUser);

    // Payment Methods
    userRouter.get("/payment-methods", paymentMethodController.listForUser);

    // Payments
    userRouter.get("/payments", paymentController.listForUser);
    userRouter.get("/payments/:id", paymentController.detailForUser);
    userRouter.post("/payments", paymentController.createForUser);

    this.router.use("/user", userRouter);
  }

  private adminGroup() {
    const adminRouter = Router();
    adminRouter.use(adminAuthMiddleware);

    // Users
    adminRouter.get("/users/list", userController.list);
    adminRouter.post("/users", userController.store);
    adminRouter.put("/users/:id", userController.update);
    adminRouter.delete("/users/:id", userController.delete);

    // Destination
    adminRouter.get("/destination/list", destinationController.list);
    adminRouter.post("/destination", destinationController.store);
    adminRouter.put("/destination/:id", destinationController.update);
    adminRouter.delete("/destination/:id", destinationController.delete);

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

    // Payment Metodes
    adminRouter.get("/paymentmetodes/list", paymentMethodController.list);
    adminRouter.post("/paymentmetodes", paymentMethodController.store);
    adminRouter.put("/paymentmetodes/:id", paymentMethodController.update);
    adminRouter.delete("/paymentmetodes/:id", paymentMethodController.delete);

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
}

export default new Route().router;
