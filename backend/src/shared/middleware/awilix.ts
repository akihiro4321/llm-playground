import { AwilixContainer } from "awilix";
import { MiddlewareHandler } from "hono";

import { Cradle } from "@/app/container/types";
import { HonoEnv } from "@/shared/types/hono";

export const scopePerRequest = (container: AwilixContainer<Cradle>): MiddlewareHandler<HonoEnv> => {
  return async (c, next) => {
    const scope = container.createScope();
    c.set("container", scope);
    c.set("cradle", scope.cradle);
    await next();
  };
};
