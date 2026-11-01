import { seedStore } from "../src/server/seed";
import { getDb } from "../src/server/db";

seedStore().then(result => console.log("Opening snapshot:", result)).finally(() => getDb().$disconnect());
