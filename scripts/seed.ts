import { seedStore } from "../src/server/seed";
import { getDb } from "../src/server/db";

seedStore().then(result => console.log("Opening snapshot:", result)).catch(()=>{console.error("Store seed failed; check protected database configuration and migrations. Credential values were not printed.");process.exitCode=1;}).finally(() => getDb().$disconnect());
