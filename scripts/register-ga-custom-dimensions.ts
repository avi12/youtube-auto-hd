/**
 * Creates the custom dimensions that make our GA4 event parameters reportable.
 *
 * A parameter GA4 has no custom dimension for is collected and then invisible: it cannot be
 * picked in Explore, added to a report, or used as a filter. This script reads the same catalog
 * the extension sends from (`src/lib/ythd-analytics-definitions.ts`) and creates whatever the
 * property is missing, so registering can never fall behind what ships. It is idempotent - run it
 * after every change to the catalog.
 *
 * Usage:
 *   pnpm ga:dimensions --dry-run    # show what would be created
 *   pnpm ga:dimensions              # create the missing ones
 *
 * Auth needs two separate things, granted in two different places:
 *   1. A token carrying the `analytics.edit` scope. A service account signs one for itself, so
 *      this reads `gcloud auth print-access-token --scopes=...` (GA_ADMIN_ACCOUNT picks which
 *      account, GA_ADMIN_ACCESS_TOKEN overrides the lot). Do not reach for
 *      `application-default login --scopes=...` - Google blocks the shared SDK client from asking
 *      for Analytics scopes, and the sign-in dead-ends at "this app is blocked".
 *   2. Editor on the GA4 property for that identity, added in GA4 Admin -> Property access
 *      management. Google Cloud IAM does not grant it and no API can grant it to itself.
 * The Analytics Admin API also has to be enabled on the token's project.
 * The property is found from VITE_GOOGLE_ANALYTICS_MEASUREMENT_ID unless GA_PROPERTY_ID is set.
 */

import { GA_EVENT_DIMENSIONS, GA_USER_DIMENSIONS } from "../src/lib/ythd-analytics-definitions";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

const ADMIN_API_ORIGIN = "https://analyticsadmin.googleapis.com/v1beta";
const ANALYTICS_EDIT_SCOPE = "https://www.googleapis.com/auth/analytics.edit";
const DIMENSION_PAGE_SIZE = 200;
const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const ENV_FILES = [".env.production.local", ".env.local", ".env"];
const TOKEN_INFO_ENDPOINT = "https://oauth2.googleapis.com/tokeninfo";

const DimensionScope = {
  event: "EVENT",
  user: "USER"
} as const;

type DimensionScope = (typeof DimensionScope)[keyof typeof DimensionScope];

type PlannedDimension = {
  parameterName: string;
  displayName: string;
  description: string;
  scope: DimensionScope;
};

const accountSummariesSchema = z.object({
  accountSummaries: z.array(
    z.object({
      propertySummaries: z.array(
        z.object({
          property: z.string(),
          displayName: z.string()
        })
      ).optional()
    })
  ).optional()
});

const dataStreamsSchema = z.object({
  dataStreams: z.array(
    z.object({
      webStreamData: z.object({ measurementId: z.string().optional() }).optional()
    })
  ).optional()
});

const customDimensionSchema = z.object({
  parameterName: z.string(),
  scope: z.string()
});

const customDimensionsSchema = z.object({ customDimensions: z.array(customDimensionSchema).optional() });

const tokenInfoSchema = z.object({ email: z.string().optional() });

const isDryRun = process.argv.includes("--dry-run");

function loadEnvironment() {
  for (const file of ENV_FILES) {
    const path = resolve(PROJECT_ROOT, file);
    if (existsSync(path)) {
      process.loadEnvFile(path);
    }
  }
}

// Throwing rather than exiting on the spot: an abrupt process.exit while a fetch is still in
// flight trips a libuv assertion on Windows, which buries the message that mattered.
function fail(message: string): never {
  throw new Error(message);
}

// Windows ships gcloud as a .cmd shim, and Node refuses to execFile one without a shell - so these
// run as plain shell commands, which they can because nothing in them is user input.
function runGcloud(command: string) {
  try {
    return execSync(`gcloud ${command}`, {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return "";
  }
}

function readGcloudToken() {
  const { GA_ADMIN_ACCOUNT } = process.env;
  const accountFlag = GA_ADMIN_ACCOUNT ? ` --account=${GA_ADMIN_ACCOUNT}` : "";
  const serviceAccountToken = runGcloud(`auth print-access-token${accountFlag} --scopes=${ANALYTICS_EDIT_SCOPE}`);

  return serviceAccountToken || runGcloud("auth application-default print-access-token");
}

async function readTokenIdentity(token: string) {
  const response = await fetch(`${TOKEN_INFO_ENDPOINT}?access_token=${token}`);
  if (!response.ok) {
    return "";
  }

  const parsed = tokenInfoSchema.safeParse(await response.json());
  if (!parsed.success) {
    return "";
  }

  return parsed.data.email ?? "";
}

function printCatalog(planned: PlannedDimension[]) {
  console.log("\nThe catalog the extension sends - paste these into GA4 Admin -> Custom definitions:\n");
  for (const dimension of planned) {
    console.log(`  ${dimension.scope.padEnd(5)} ${dimension.parameterName.padEnd(20)} ${dimension.displayName}`);
  }
}

function resolveAccessToken() {
  const token = process.env.GA_ADMIN_ACCESS_TOKEN || readGcloudToken();
  if (token) {
    return token;
  }

  return fail(
    [
      "No Google access token. Export GA_ADMIN_ACCESS_TOKEN, or let gcloud sign one for a service",
      "account that can mint the Analytics scope itself:",
      "",
      `  gcloud auth print-access-token --account=<service-account> --scopes=${ANALYTICS_EDIT_SCOPE}`,
      "",
      "Set GA_ADMIN_ACCOUNT to that address to have this script run the command for you."
    ].join("\n")
  );
}

async function callAdminApi<TSchema extends z.ZodType>({ path, token, schema, body }: {
  path: string;
  token: string;
  schema: TSchema;
  body?: unknown;
}) {
  const response = await fetch(`${ADMIN_API_ORIGIN}/${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!response.ok) {
    const detail = await response.text();
    const isForbidden = response.status === 403;
    if (isForbidden) {
      const identity = await readTokenIdentity(token) || "the account this token belongs to";
      fail(
        [
          `Admin API 403 on ${path}`,
          detail,
          "",
          `Either ${identity} is missing the ${ANALYTICS_EDIT_SCOPE} scope, or it has no access to`,
          "this GA4 property. The scope is minted per call, so it is nearly always the second - add",
          "that address as an Editor in GA4 Admin -> Property access management."
        ].join("\n")
      );
    }

    fail(`Admin API ${response.status} on ${path}\n${detail}`);
  }

  const parsed = schema.safeParse(await response.json());
  if (!parsed.success) {
    fail(`Admin API returned an unexpected shape for ${path}\n${parsed.error.message}`);
  }

  return parsed.data;
}

async function findPropertyIdByMeasurementId({ measurementId, token }: {
  measurementId: string;
  token: string;
}) {
  const summaries = await callAdminApi({
    path: "accountSummaries?pageSize=200",
    token,
    schema: accountSummariesSchema
  });

  const accounts = summaries.accountSummaries ?? [];
  const hasAnalyticsAccess = accounts.length > 0;
  if (!hasAnalyticsAccess) {
    const identity = await readTokenIdentity(token) || "the account this token belongs to";
    return fail(
      [
        `The Admin API answered, but ${identity} can see no GA4 account at all.`,
        "",
        "Analytics access is granted inside Analytics - Google Cloud IAM has no say in it. Open",
        "GA4 Admin -> Property access management, add this as an Editor, and untick the email notice:",
        "",
        `  ${identity}`,
        "",
        "If it was granted on the PROPERTY rather than the account, this list stays empty by design -",
        "set GA_PROPERTY_ID to skip the lookup. GA_ADMIN_ACCOUNT picks a different gcloud account."
      ].join("\n")
    );
  }

  for (const account of accounts) {
    for (const property of account.propertySummaries ?? []) {
      const streams = await callAdminApi({
        path: `${property.property}/dataStreams?pageSize=200`,
        token,
        schema: dataStreamsSchema
      });
      const isMatch = streams.dataStreams?.some(stream => stream.webStreamData?.measurementId === measurementId);
      if (isMatch) {
        console.log(`Property: ${property.displayName} (${property.property})`);
        return property.property.replace("properties/", "");
      }
    }
  }

  return fail(`No GA4 property has a data stream with measurement ID ${measurementId}. Set GA_PROPERTY_ID to skip this lookup.`);
}

function planDimensions(): PlannedDimension[] {
  return [
    ...GA_EVENT_DIMENSIONS.map(dimension => ({
      ...dimension,
      scope: DimensionScope.event
    })),
    ...GA_USER_DIMENSIONS.map(dimension => ({
      ...dimension,
      scope: DimensionScope.user
    }))
  ];
}

async function readExistingDimensions({ propertyId, token }: {
  propertyId: string;
  token: string;
}) {
  const response = await callAdminApi({
    path: `properties/${propertyId}/customDimensions?pageSize=${DIMENSION_PAGE_SIZE}`,
    token,
    schema: customDimensionsSchema
  });
  return new Set((response.customDimensions ?? []).map(dimension => `${dimension.scope}:${dimension.parameterName}`));
}

async function run() {
  loadEnvironment();
  const planned = planDimensions();
  const isCatalogOnly = isDryRun && !process.env.GA_ADMIN_ACCESS_TOKEN && !readGcloudToken();
  if (isCatalogOnly) {
    printCatalog(planned);
    return;
  }

  const token = resolveAccessToken();
  const propertyId = process.env.GA_PROPERTY_ID || await findPropertyIdByMeasurementId({
    measurementId: process.env.VITE_GOOGLE_ANALYTICS_MEASUREMENT_ID ?? "",
    token
  });

  const existing = await readExistingDimensions({
    propertyId,
    token
  });
  const missing = planned.filter(dimension => !existing.has(`${dimension.scope}:${dimension.parameterName}`));

  console.log(`\n${planned.length} dimensions in the catalog, ${planned.length - missing.length} already registered.\n`);

  if (missing.length === 0) {
    console.log("Nothing to create - every parameter the extension sends is reportable.");
    return;
  }

  for (const dimension of missing) {
    console.log(`  ${isDryRun ? "would create" : "creating"}  ${dimension.scope.padEnd(5)} ${dimension.parameterName} -> "${dimension.displayName}"`);

    if (isDryRun) {
      continue;
    }

    await callAdminApi({
      path: `properties/${propertyId}/customDimensions`,
      token,
      body: dimension,
      schema: customDimensionSchema
    });
  }

  const isCreated = !isDryRun;
  console.log(`\n${missing.length} ${isCreated ? "created" : "pending"}. GA4 starts populating a new dimension from the moment it exists - it does not backfill.`);
}

try {
  await run();
} catch (error) {
  console.error(`\n${error instanceof Error ? error.message : error}\n`);
  process.exitCode = 1;
}
