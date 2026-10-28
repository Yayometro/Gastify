// The collections the admin panel owns. Nothing in the app reads them except the panel.
export const METRICS_COLLECTION = "admin_metrics_daily";
export const AUDIT_COLLECTION = "admin_audit";
export const SNAPSHOTS_COLLECTION = "admin_snapshots";

// The same database and connection pool the app uses (see src/lib/db/mongoClient.ts). The modules are loaded when first needed,
// not on import: the routes that only count a metric must not open a database connection just by being imported, and a test
// that never touches the database must not need a connection string. The type is inferred on purpose: Mongoose bundles its own
// copy of the driver, and the two copies' Db types do not match by name.
export async function adminDb() {
  const [{ default: dbConnection }, { getSharedMongoClient }] = await Promise.all([
    import("@/app/api/dbConnection"),
    import("@/lib/db/mongoClient"),
  ]);
  await dbConnection();
  return getSharedMongoClient().db();
}
