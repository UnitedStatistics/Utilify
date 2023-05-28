import { ApplicationCommandRegistries, RegisterBehavior } from "@sapphire/framework";
import "@sapphire/plugin-logger/register";
import { setup } from "@skyra/env-utilities";
import * as colorette from "colorette";
import { join } from "node:path";
import { rootDir } from "../consts";

// Set default behavior to bulk overwrite
ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite);

// Read env var
setup({ path: join(rootDir, ".env") });

import "./env";

// Enable colorette
colorette.createColors({ useColor: true });
