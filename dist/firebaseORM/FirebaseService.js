"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const FirebaseAdmin_1 = require("./FirebaseAdmin");
dotenv_1.default.config();
class FirebaseAdminService {
    db = FirebaseAdmin_1.db;
    rtdb = FirebaseAdmin_1.rtdb;
    collectionName;
    schema;
    cachedData = [];
    relations = {};
    /**
     * Creates an instance of the Firebase Admin handler.
     *
     * @param modelName - The name of the model/collection for which the Firebase handler is being created.
     * @param schema - The schema definition for the model.
     * @param serviceAccount - Firebase Admin service account credentials.
     *
     * Initializes the schema with an 'id' field of type string.
     * Sets up Firebase connection with the appropriate collection name.
     */
    constructor(modelName, schema) {
        this.schema = {
            id: "string",
            created_at: "string",
            updated_at: "string",
            ...schema,
        };
        this.collectionName = modelName;
        this.updateDataBaseOnSchema();
    }
    async updateDataBaseOnSchema() {
        await this.readFromFirestore();
        let hasChanges = false;
        const updatedData = this.cachedData.map((item) => {
            let itemChanged = false;
            const updatedItem = { ...item };
            // Check each field in the schema
            for (const key in this.schema) {
                if (!(key in updatedItem)) {
                    // Field exists in schema but not in data, add default value
                    updatedItem[key] = this.getDefaultValueForType(this.schema[key]);
                    itemChanged = true;
                }
            }
            if (itemChanged) {
                hasChanges = true;
            }
            return updatedItem;
        });
        // If there are changes, write back to Firestore
        if (hasChanges) {
            await this.writeToFirestore(updatedData, "overwrite");
            this.cachedData = updatedData;
        }
    }
    getDefaultValueForType(typeDef) {
        if (typeof typeDef === "string") {
            // Handle primitive types
            switch (typeDef) {
                case "string":
                    return "";
                case "number":
                    return 0;
                case "boolean":
                    return false;
                default:
                    return null;
            }
        }
        else if (Array.isArray(typeDef)) {
            // For array types, return an empty array
            return [];
        }
        else {
            // For complex object types, recursively build default object
            const defaultObj = {};
            for (const key in typeDef) {
                defaultObj[key] = this.getDefaultValueForType(typeDef[key]);
            }
            return defaultObj;
        }
    }
    async readFromFirestore() {
        if (this.cachedData.length === 0) {
            const querySnapshot = await this.db.collection(this.collectionName).get();
            const data = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
            });
            this.cachedData = data;
            return data;
        }
        return this.cachedData;
    }
    async writeToFirestore(data, operation = "add") {
        const batch = this.db.batch();
        // For complete overwrite operations
        if (operation === "overwrite") {
            // First delete all existing documents
            const querySnapshot = await this.db.collection(this.collectionName).get();
            querySnapshot.forEach((document) => {
                batch.delete(this.db.collection(this.collectionName).doc(document.id));
            });
            // Then add all new documents
            data.forEach((item) => {
                const docRef = this.db.collection(this.collectionName).doc(item.id);
                batch.set(docRef, item);
            });
        }
        else {
            // For adding/updating specific documents
            data.forEach((item) => {
                const docRef = this.db.collection(this.collectionName).doc(item.id);
                batch.set(docRef, item);
            });
        }
        await batch.commit();
        this.cachedData = data;
    }
    validateSchema(schema, data) {
        for (const key in schema) {
            if (!(key in data)) {
                throw new Error(`Missing required field: ${key}`);
            }
            const expectedType = schema[key];
            this.validateField(expectedType, data[key], key);
        }
    }
    validateField(expectedType, value, key) {
        if (typeof expectedType === "string") {
            if (typeof value !== expectedType) {
                throw new Error(`Invalid type for field ${key}: expected ${expectedType}, got ${typeof value}`);
            }
        }
        else if (Array.isArray(expectedType)) {
            if (!Array.isArray(value)) {
                throw new Error(`Invalid type for field ${key}: expected array, got ${typeof value}`);
            }
            for (const item of value) {
                this.validateField(expectedType[0], item, key);
            }
        }
        else {
            this.validateSchema(expectedType, value);
        }
    }
    /**
     * Creates a new entry with the provided data.
     *
     * This method generates a unique ID for the new entry, validates the data against the schema,
     * and adds the new entry to Firestore. It also logs the addition of the new entry.
     *
     * @param data - The data to be added. This should be an object that conforms to the expected schema.
     *
     * @throws Will throw an error if the data does not conform to the schema.
     */
    async create(data) {
        const timestamp = new Date().toString();
        const id = crypto.randomUUID(); // Generate unique ID using uuid
        data = {
            id: id,
            created_at: timestamp,
            updated_at: timestamp,
            ...data,
        };
        this.validateSchema(this.schema, data);
        // Save fields that only exist in schema
        const filteredData = Object.keys(data)
            .filter((key) => key in this.schema)
            .reduce((obj, key) => {
            obj[key] = data[key];
            return obj;
        }, {});
        // Add the document to Firestore
        await this.db.collection(this.collectionName).doc(id).set(filteredData);
        // Clear cache
        this.cachedData = [];
        // Log operation
        await this.log(`Added data with ID: ${id}`);
        return data;
    }
    /**
     * Creates multiple data entries, assigns a unique ID to each entry,
     * validates each entry against the provided schema, and writes the
     * entries to Firestore.
     *
     * @param data - An array of data objects to be created.
     */
    async createMany(data) {
        const timestamp = new Date().toString();
        const batch = this.db.batch();
        // Process each item
        data.forEach((item) => {
            const id = crypto.randomUUID();
            item.id = id;
            item.created_at = timestamp;
            item.updated_at = timestamp;
            this.validateSchema(this.schema, item);
            // Filter for fields in schema
            const filteredItem = Object.keys(item)
                .filter((key) => key in this.schema)
                .reduce((obj, key) => {
                obj[key] = item[key];
                return obj;
            }, {});
            const docRef = this.db.collection(this.collectionName).doc(id);
            batch.set(docRef, filteredItem);
        });
        // Commit all writes
        await batch.commit();
        // Clear cache
        this.cachedData = [];
        // Log operation
        await this.log(`Added ${data.length} data`);
    }
    /**
     * Reads and returns all documents from the collection.
     *
     * @returns {Promise<any[]>} All documents in the collection.
     */
    async read() {
        return this.readFromFirestore();
    }
    /**
     * Reads data with options for pagination and field exclusion
     *
     * @param {Object} params - The parameters object
     * @param {Object} [params.options] - Pagination options
     * @param {number} [params.options.limit] - Maximum items to return
     * @param {number} [params.options.offset] - Items to skip
     * @param {string[]} [params.fields] - Fields to exclude from results
     * @returns {Promise<any[]>} Filtered and paginated data
     */
    async readWithOptionsAndFields({ options = {}, fields = [], } = {}) {
        let result = await this.readFromFirestore();
        const { limit: limitCount, offset } = options;
        // Apply pagination
        if (typeof offset === "number") {
            result = result.slice(offset);
        }
        if (typeof limitCount === "number") {
            result = result.slice(0, limitCount);
        }
        // Remove specified fields
        if (fields.length > 0) {
            result = result.map((item) => {
                const newItem = { ...item };
                fields.forEach((field) => {
                    delete newItem[field];
                });
                return newItem;
            });
        }
        return result;
    }
    /**
     * Reads data from Firestore and returns an array of objects containing only the specified fields.
     *
     * @param {Object} params - The parameters for the function.
     * @param {string[]} params.fields - An array of strings representing the fields to be included in the returned objects.
     * @returns {Promise<any[]>} An array of objects, each containing only the specified fields.
     */
    async readWithFields({ fields }) {
        const allData = await this.readFromFirestore();
        return allData.map((item) => {
            const newItem = {};
            fields.forEach((field) => {
                if (field in item) {
                    newItem[field] = item[field];
                }
            });
            return newItem;
        });
    }
    /**
     * Updates an existing document with the specified ID.
     *
     * @param id - The unique identifier of the document to update.
     * @param data - An object containing the new data to update the document with.
     *
     * @throws Will throw an error if the document with the specified ID is not found.
     * @throws Will throw an error if any field in the data object is not defined in the schema.
     */
    async update(id, data) {
        // Check if document exists
        const docRef = this.db.collection(this.collectionName).doc(id);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
            throw new Error(`Data with ID: ${id} not found`);
        }
        const validData = docSnap.data();
        // Update only fields that exist in schema and validate the data
        const updates = { updated_at: new Date().toString() };
        for (let key in data) {
            if (key in this.schema) {
                const tempData = { ...validData, [key]: data[key] };
                this.validateSchema(this.schema, { id, ...tempData });
                updates[key] = data[key];
                updates.updated_at = new Date().toString();
            }
            else {
                throw new Error(`Field ${key} is not defined in schema`);
            }
        }
        // Update the document
        await docRef.update(updates);
        // Clear cache
        this.cachedData = [];
        // Log operation
        await this.log(`Updated data with ID: ${id}`);
    }
    /**
     * Deletes a document from Firestore by its ID.
     *
     * @param {string} id - The ID of the document to delete.
     * @throws {Error} If no document with the given ID is found.
     * @returns {Promise<void>}
     */
    async delete(id) {
        // Check if document exists
        const docRef = this.db.collection(this.collectionName).doc(id);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
            throw new Error(`Data with ID: ${id} not found`);
        }
        // Delete the document
        await docRef.delete();
        // Clear cache
        this.cachedData = [];
        // Log operation
        await this.log(`Deleted data with ID: ${id}`);
    }
    /**
     * Searches for documents in the collection that match the specified field, operator, and value.
     *
     * @param {string} field - The field to search within each document.
     * @param {Operator} operator - The operator to use for comparison.
     * @param {any} value - The value to compare against the field.
     * @returns {Promise<any[]>} An array of documents that match the search criteria.
     * @throws {Error} If an unsupported operator is provided.
     */
    async search(field, operator, value) {
        const allData = await this.readFromFirestore();
        // Log operation
        await this.log("search");
        return allData.filter((item) => {
            if (!(field in item)) {
                throw new Error(`Field ${field} does not exist in data`);
            }
            switch (operator) {
                case "==":
                    return item[field] === value;
                case "!=":
                    return item[field] !== value;
                case ">":
                    return item[field] > value;
                case "<":
                    return item[field] < value;
                case ">=":
                    return item[field] >= value;
                case "<=":
                    return item[field] <= value;
                default:
                    throw new Error(`Unsupported operator: ${operator}`);
            }
        });
    }
    /**
     * Advanced search with pagination and field exclusion
     *
     * @param {Object} params - Search parameters
     * @param {string} params.field - Field to search on
     * @param {Operator} params.operator - Comparison operator
     * @param {any} params.value - Value to compare against
     * @param {Object} [params.options] - Pagination options
     * @param {number} [params.options.limit] - Maximum items to return
     * @param {number} [params.options.offset] - Items to skip
     * @param {string[]} [params.withOutFields] - Fields to exclude from results
     * @returns {Promise<any[]>} Filtered, paginated and field-excluded data
     */
    async advancedSearch({ field, operator, value, options = {}, withOutFields = [], }) {
        try {
            // First apply search
            let result = await this.search(field, operator, value);
            // Then apply pagination
            const { limit: limitCount, offset } = options;
            if (typeof offset === "number") {
                result = result.slice(offset);
            }
            if (typeof limitCount === "number") {
                result = result.slice(0, limitCount);
            }
            // Finally remove specified fields
            if (withOutFields.length > 0) {
                result = result.map((item) => {
                    const newItem = { ...item };
                    withOutFields.forEach((field) => {
                        delete newItem[field];
                    });
                    return newItem;
                });
            }
            return result;
        }
        catch (error) {
            await this.log("advanced search error");
            throw error;
        }
    }
    /**
     * Searches for documents in the collection that match multiple conditions.
     *
     * @param wheres - An array of conditions, where each condition is an object containing:
     *   - field: The field to search within each document.
     *   - operator: The operator to use for comparison.
     *   - value: The value to compare against the field.
     * @returns {Promise<any[]>} An array of documents that match all the specified conditions.
     * @throws {Error} If an unsupported operator is provided.
     */
    async searchWheres(wheres, orderBy = {
        field: "created_at",
        direction: "asc",
    }) {
        const allData = await this.readFromFirestore();
        const filteredData = allData.filter((item) => {
            return wheres.every(({ field, operator, value }) => {
                if (!(field in item)) {
                    throw new Error(`Field ${field} does not exist in data`);
                }
                switch (operator) {
                    case "==":
                        return item[field] === value;
                    case "!=":
                        return item[field] !== value;
                    case ">":
                        return item[field] > value;
                    case "<":
                        return item[field] < value;
                    case ">=":
                        return item[field] >= value;
                    case "<=":
                        return item[field] <= value;
                    case "in":
                        return Array.isArray(value) ? value.includes(item[field]) : false;
                    case "array-contains":
                        return Array.isArray(item[field])
                            ? item[field].includes(value)
                            : false;
                    case "array-contains-any":
                        return Array.isArray(value)
                            ? value.some((v) => v === item[field])
                            : false;
                    case "not-in":
                        return Array.isArray(value) ? !value.includes(item[field]) : false;
                    default:
                        throw new Error(`Unsupported operator: ${operator}`);
                }
            });
        });
        const { field, direction } = orderBy;
        return filteredData.sort((a, b) => {
            if (!(field in a) || !(field in b)) {
                throw new Error(`Field ${field} does not exist in data`);
            }
            if (a[field] < b[field])
                return direction === "asc" ? -1 : 1;
            if (a[field] > b[field])
                return direction === "asc" ? 1 : -1;
            return 0;
        });
    }
    /**
     * Logs a message to the Firebase Realtime Database.
     *
     * @param message - The message to log.
     */
    async log(message) {
        try {
            const logsRef = this.rtdb.ref("logs");
            const newLogRef = logsRef.push();
            await newLogRef.set({
                timestamp: new Date().toISOString(),
                message,
                collection: this.collectionName,
            });
        }
        catch (error) {
            console.error("Error writing log:", error);
        }
    }
    /**
     * Define a relationship with another model.
     *
     * @param relationName - The name of the relation.
     * @param options - The relation configuration.
     */
    setRelation(relationName, options) {
        this.relations[relationName] = options;
    }
    /**
     * Retrieve related data for a given item ID.
     *
     * @param id - The ID of the item to retrieve related data for.
     * @param relationName - The name of the relation to fetch.
     */
    async getRelated(id, relationName) {
        const relation = this.relations[relationName];
        if (!relation) {
            throw new Error(`Relation ${relationName} is not defined`);
        }
        // Get the document
        const docRef = this.db.collection(this.collectionName).doc(id);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
            throw new Error(`Item with ID ${id} not found`);
        }
        const item = {
            id: docSnap.id,
            ...docSnap.data(),
        };
        const { model, type, foreignKey, localKey } = relation;
        const relatedData = await model.read();
        if (type === "one-to-one") {
            return relatedData.find((relatedItem) => relatedItem[foreignKey] === item[localKey]);
        }
        else if (type === "one-to-many") {
            return relatedData.filter((relatedItem) => relatedItem[foreignKey] === item[localKey]);
        }
        else if (type === "many-to-many") {
            // Example for many-to-many with intermediate table logic
            return relatedData.filter((relatedItem) => relatedItem[foreignKey].includes(item[localKey]));
        }
        return [];
    }
    /**
     * Deletes a document and handles cascading deletion for related data.
     *
     * @param {string} id - The ID of the document to delete.
     */
    async deleteWithRelation(id) {
        // Check if document exists
        const docRef = this.db.collection(this.collectionName).doc(id);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
            throw new Error(`Data with ID: ${id} not found`);
        }
        const item = {
            id: docSnap.id,
            ...docSnap.data(),
        };
        // Handle cascading delete for relations
        for (const relationName in this.relations) {
            const relation = this.relations[relationName];
            const { model, type, foreignKey, localKey, onDeleteNull = false, } = relation;
            if (type === "one-to-one") {
                const relatedItems = await model.read();
                const relatedItem = relatedItems.find((related) => related[foreignKey] === item[localKey]);
                if (relatedItem) {
                    await model.deleteWithRelation(relatedItem.id); // Recursive delete
                }
            }
            else if (type === "one-to-many") {
                const relatedItems = await model.read();
                const itemsToUpdateOrDelete = relatedItems.filter((related) => related[foreignKey] === item[localKey]);
                for (const relatedItem of itemsToUpdateOrDelete) {
                    if (onDeleteNull) {
                        // Set foreign key to null
                        await model.update(relatedItem.id, { [foreignKey]: null });
                    }
                    else {
                        // Delete the related item
                        await model.deleteWithRelation(relatedItem.id);
                    }
                }
            }
            else if (type === "many-to-many") {
                const relatedItems = await model.read();
                const itemsToDelete = relatedItems.filter((related) => related[foreignKey].includes(item[localKey]));
                for (const relatedItem of itemsToDelete) {
                    await model.deleteWithRelation(relatedItem.id);
                }
            }
        }
        // Delete the document
        await docRef.delete();
        // Clear cache
        this.cachedData = [];
        // Log operation
        await this.log(`Deleted data with ID: ${id} with relations`);
    }
    /**
     * Performs a direct query on Firestore with native query methods.
     * This gives more flexibility for complex queries than the basic search methods.
     *
     * @param {Function} queryBuilder - A function that takes a collection reference and builds a query
     * @returns {Promise<any[]>} Array of matching documents
     */
    async nativeQuery(queryBuilder) {
        const collectionRef = this.db.collection(this.collectionName);
        const query = queryBuilder(collectionRef);
        const querySnapshot = await query.get();
        const results = [];
        querySnapshot.forEach((doc) => {
            results.push({ id: doc.id, ...doc.data() });
        });
        return results;
    }
    /**
     * Performs a transaction to ensure atomic updates across multiple documents
     *
     * @param {Function} transactionHandler - Function that performs operations within the transaction
     * @returns {Promise<any>} Result of the transaction
     */
    async runTransaction(transactionHandler) {
        return this.db.runTransaction(transactionHandler);
    }
    /**
     * Creates or updates a document (upsert operation)
     *
     * @param {string} id - Document ID
     * @param {any} data - Document data
     * @returns {Promise<any>} The created or updated document
     */
    async upsert(id, data) {
        const docRef = this.db.collection(this.collectionName).doc(id);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            await this.update(id, data);
            return { id, ...data };
        }
        else {
            const newData = { ...data, id };
            return this.create(newData);
        }
    }
    /**
     * Performs a batch write operation for better performance with multiple writes
     *
     * @param {Array<{operation: 'create'|'update'|'delete', id?: string, data?: any}>} operations
     * @returns {Promise<void>}
     */
    async batchWrite(operations) {
        const batch = this.db.batch();
        const timestamp = new Date().toString();
        for (const op of operations) {
            if (op.operation === "delete" && op.id) {
                const docRef = this.db.collection(this.collectionName).doc(op.id);
                batch.delete(docRef);
            }
            else if (op.operation === "update" && op.id && op.data) {
                const docRef = this.db.collection(this.collectionName).doc(op.id);
                const updates = { ...op.data, updated_at: timestamp };
                batch.update(docRef, updates);
            }
            else if (op.operation === "create" && op.data) {
                const id = op.id || crypto.randomUUID();
                const docRef = this.db.collection(this.collectionName).doc(id);
                const newData = {
                    id,
                    created_at: timestamp,
                    updated_at: timestamp,
                    ...op.data,
                };
                batch.set(docRef, newData);
            }
        }
        await batch.commit();
        this.cachedData = []; // Clear cache after batch operation
    }
}
exports.default = FirebaseAdminService;
