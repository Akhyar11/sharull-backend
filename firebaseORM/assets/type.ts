export type SchemaField = "string" | "number" | "boolean";
export type SchemaDefinition = SchemaField | SchemaField[] | SchemaObject;
export interface SchemaObject {
  [key: string]: SchemaDefinition;
}
export interface Schema {
  [key: string]: SchemaDefinition;
}

export type Operator =
  | "=="
  | "!="
  | "<"
  | ">"
  | "<="
  | ">="
  | "array-contains"
  | "in"
  | "array-contains-any"
  | "not-in";
export type OrderBy = { field: string; direction: "asc" | "desc" };

export type Where = {
  field: string;
  operator: Operator;
  value: any;
};
