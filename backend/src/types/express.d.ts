import type { AwilixContainer } from "awilix";

import type { Cradle } from "@/infrastructure/container";

declare global {
  namespace Express {
    interface Request {
      container: AwilixContainer<Cradle>;
      cradle: Cradle;
    }
  }
}
