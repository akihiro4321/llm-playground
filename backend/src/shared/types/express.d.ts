import type { AwilixContainer } from "awilix";

import type { Cradle } from "@/app/container";

declare global {
  namespace Express {
    interface Request {
      container: AwilixContainer<Cradle>;
      cradle: Cradle;
    }
  }
}
