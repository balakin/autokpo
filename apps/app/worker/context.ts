import type { Session } from './auth';

export type WorkerVariables = {
  session: Session;
};

export type WorkerHonoEnv = {
  Bindings: Env;
  Variables: WorkerVariables;
};
