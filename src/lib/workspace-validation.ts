import Ajv from "ajv";
import schemas from "@/lib/workspace-schema.json";
import { validateRecord, type Collection } from "@/lib/workspace-protocol";
const ajv = new Ajv({ allErrors: false, strict: false });
const validators = Object.fromEntries(Object.entries(schemas).map(([key, schema]) => [key, ajv.compile(schema)]));
export function validateBusinessRecord(collection: Collection, id: string, data: unknown) {
  validateRecord(collection, id, data);
  const validate = validators[collection];
  if (validate && !validate(data)) throw new Error(`Invalid ${collection}: ${ajv.errorsText(validate.errors)}`);
}
