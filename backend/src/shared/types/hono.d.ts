import { AwilixContainer } from "awilix";
import { Cradle } from "@/app/container/types";

export type HonoEnv = {
  Variables: {
    container: AwilixContainer<Cradle>;
    cradle: Cradle;
  };
};
