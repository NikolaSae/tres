// Path: actions/operators/index.ts

"use server";

import { db } from "@/lib/db";
import { OperatorPayload } from "@/lib/types/operator-types";
import { operatorSchema } from "@/schemas/operator";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

import { getContractsByOperatorId } from "./getContractsByOperatorId";
import { createOperator } from "./create";
import { updateOperator } from "./update";
import { deleteOperator } from "./delete";
import { getOperators } from "./getOperators";
import { getOperatorById } from "./getOperatorById";
import { getAllOperators } from "./getAllOperators";

export { createOperator };
export { updateOperator };
export { deleteOperator };
export { getOperators };
export { getOperatorById };
export { getContractsByOperatorId };
export { getAllOperators };

/*
export async function createOperator(...) { ... }
export async function updateOperator(...) { ... }
export async function deleteOperator(...) { ... }
export async function getOperators(...) { ... }
export async function getOperatorById(...) { ... }
export async function getContractsByOperatorId(...) { ... }
export async function getAllOperators(...) { ... } // Dodajte export ovde
*/
