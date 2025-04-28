"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceController = void 0;
const invoices_1 = require("../models/invoices");
class InvoiceController {
    /**
     * List all invoices with optional filters, pagination, and sorting.
     */
    async list(req, res) {
        try {
            const { page, limit, id, booking_id, invoice_number, status, orderBy = "issued_date_desc", } = req.query;
            const filters = [];
            if (id)
                filters.push({ field: "id", operator: "==", value: id });
            if (booking_id)
                filters.push({
                    field: "booking_id",
                    operator: "==",
                    value: booking_id,
                });
            if (invoice_number)
                filters.push({
                    field: "invoice_number",
                    operator: "==",
                    value: invoice_number,
                });
            if (status)
                filters.push({ field: "status", operator: "==", value: status });
            const orderByOptions = {
                field: orderBy.split("_")[0],
                direction: orderBy.split("_")[1],
            };
            const invoices = await invoices_1.invoiceModel.searchWheres(filters, orderByOptions);
            const pageNumber = parseInt(page) || 1;
            const limitNumber = parseInt(limit) || 10;
            const startIndex = (pageNumber - 1) * limitNumber;
            const endIndex = startIndex + limitNumber;
            const paginatedInvoices = invoices.slice(startIndex, endIndex);
            const data = paginatedInvoices.map((invoice, index) => ({
                no: index + 1 + startIndex,
                ...invoice,
            }));
            res.status(200).json({
                list: data,
                total: invoices.length,
                page: pageNumber,
                limit: limitNumber,
            });
        }
        catch (error) {
            res.status(500).json({ msg: "Failed to fetch invoices" });
        }
    }
    /**
     * Create a new invoice.
     */
    async store(req, res) {
        try {
            const { booking_id, invoice_number, issued_date, due_date, status } = req.body;
            if (!booking_id ||
                !invoice_number ||
                !issued_date ||
                !due_date ||
                !status) {
                res.status(400).json({ msg: "All fields are required" });
                return;
            }
            const newInvoice = {
                booking_id,
                invoice_number,
                issued_date,
                due_date,
                status,
                created_at: new Date().toISOString(),
            };
            await invoices_1.invoiceModel.create(newInvoice);
            res
                .status(201)
                .json({ msg: "Invoice created successfully", data: newInvoice });
        }
        catch (error) {
            res.status(500).json({ msg: "Failed to create invoice" });
        }
    }
    /**
     * Update an existing invoice.
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const { booking_id, invoice_number, issued_date, due_date, status } = req.body;
            const invoices = await invoices_1.invoiceModel.search("id", "==", id);
            if (!invoices[0]) {
                res.status(404).json({ msg: "Invoice not found" });
                return;
            }
            const updatedInvoice = {
                ...invoices[0],
                booking_id: booking_id || invoices[0].booking_id,
                invoice_number: invoice_number || invoices[0].invoice_number,
                issued_date: issued_date || invoices[0].issued_date,
                due_date: due_date || invoices[0].due_date,
                status: status || invoices[0].status,
                created_at: invoices[0].created_at,
            };
            await invoices_1.invoiceModel.update(id, updatedInvoice);
            res
                .status(200)
                .json({ msg: "Invoice updated successfully", data: updatedInvoice });
        }
        catch (error) {
            res.status(500).json({ msg: "Failed to update invoice" });
        }
    }
    /**
     * Delete an invoice by ID.
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            const invoices = await invoices_1.invoiceModel.search("id", "==", id);
            if (!invoices[0]) {
                res.status(404).json({ msg: "Invoice not found" });
                return;
            }
            await invoices_1.invoiceModel.delete(id);
            res.status(200).json({ msg: "Invoice deleted successfully" });
        }
        catch (error) {
            res.status(500).json({ msg: "Failed to delete invoice" });
        }
    }
}
exports.invoiceController = new InvoiceController();
