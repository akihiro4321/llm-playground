import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const KNOWLEDGE_FILE_PATH = path.resolve(__dirname, "./sample.txt");
