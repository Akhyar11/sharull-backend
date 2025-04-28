"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const usersController_1 = require("../controllers/usersController");
const adminAuthController_1 = require("../controllers/adminAuthController");
const adminMiddleware_1 = require("../middlewares/adminMiddleware");
const packagesController_1 = require("../controllers/packagesController");
const bookingsControllers_1 = require("../controllers/bookingsControllers");
const paymentsControllers_1 = require("../controllers/paymentsControllers");
const invoicesControllers_1 = require("../controllers/invoicesControllers");
const packageSchedules_1 = require("../controllers/packageSchedules");
const fleetsController_1 = require("../controllers/fleetsController");
class Route {
    router;
    constructor() {
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post("/login", adminAuthController_1.authController.login);
        this.adminGroup();
    }
    adminGroup() {
        const adminRouter = (0, express_1.Router)();
        adminRouter.use(adminMiddleware_1.adminAuthMiddleware);
        // Users
        adminRouter.get("/users/list", usersController_1.userController.list);
        adminRouter.post("/users", usersController_1.userController.store);
        adminRouter.put("/users/:id", usersController_1.userController.update);
        adminRouter.delete("/users/:id", usersController_1.userController.delete);
        // Packages
        adminRouter.get("/packages/list", packagesController_1.packageController.list);
        adminRouter.post("/packages", packagesController_1.packageController.store);
        adminRouter.put("/packages/:id", packagesController_1.packageController.update);
        adminRouter.delete("/packages/:id", packagesController_1.packageController.delete);
        // Fleets
        adminRouter.get("/fleets/list", fleetsController_1.fleetController.list);
        adminRouter.post("/fleets", fleetsController_1.fleetController.store);
        adminRouter.put("/fleets/:id", fleetsController_1.fleetController.update);
        adminRouter.delete("/fleets/:id", fleetsController_1.fleetController.delete);
        // Package Schedules
        adminRouter.get("/packagespackages/list", packageSchedules_1.packageScheduleController.list);
        adminRouter.post("/packagespackages", packageSchedules_1.packageScheduleController.store);
        adminRouter.put("/packagespackages/:id", packageSchedules_1.packageScheduleController.update);
        adminRouter.delete("/packagespackages/:id", packageSchedules_1.packageScheduleController.delete);
        // Bookings
        adminRouter.get("/bookings/list", bookingsControllers_1.bookingController.list);
        adminRouter.post("/bookings", bookingsControllers_1.bookingController.store);
        adminRouter.put("/bookings/:id", bookingsControllers_1.bookingController.update);
        adminRouter.delete("/bookings/:id", bookingsControllers_1.bookingController.delete);
        // Payments
        adminRouter.get("/payments/list", paymentsControllers_1.paymentController.list);
        adminRouter.post("/payments", paymentsControllers_1.paymentController.store);
        adminRouter.put("/payments/:id", paymentsControllers_1.paymentController.update);
        adminRouter.delete("/payments/:id", paymentsControllers_1.paymentController.delete);
        // Invoices
        adminRouter.get("/invoices/list", invoicesControllers_1.invoiceController.list);
        adminRouter.post("/invoices", invoicesControllers_1.invoiceController.store);
        adminRouter.put("/invoices/:id", invoicesControllers_1.invoiceController.update);
        adminRouter.delete("/invoices/:id", invoicesControllers_1.invoiceController.delete);
        this.router.use("/admin", adminRouter);
    }
}
exports.default = new Route().router;
