/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as appointments from "../appointments.js";
import type * as appointmentsNode from "../appointmentsNode.js";
import type * as credits from "../credits.js";
import type * as doctor from "../doctor.js";
import type * as medicines from "../medicines.js";
import type * as patient from "../patient.js";
import type * as payout from "../payout.js";
import type * as prescriptions from "../prescriptions.js";
import type * as public_ from "../public.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  appointments: typeof appointments;
  appointmentsNode: typeof appointmentsNode;
  credits: typeof credits;
  doctor: typeof doctor;
  medicines: typeof medicines;
  patient: typeof patient;
  payout: typeof payout;
  prescriptions: typeof prescriptions;
  public: typeof public_;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
