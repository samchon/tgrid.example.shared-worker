import { Driver, SharedWorkerAcceptor, SharedWorkerServer } from "tgrid";

import { ICalcConfig } from "./interfaces/ICalcConfig";
import { ICalcEventListener } from "./interfaces/ICalcEventListener";
import { CompositeCalculator } from "./providers/CompositeCalculator";

const main = async () => {
  const server: SharedWorkerServer<
    ICalcConfig,
    CompositeCalculator,
    ICalcEventListener
  > = new SharedWorkerServer();
  await server.open(
    async (
      acceptor: SharedWorkerAcceptor<
        ICalcConfig,
        CompositeCalculator,
        ICalcEventListener
      >,
    ) => {
      const header: ICalcConfig = acceptor.header;
      const listener: Driver<ICalcEventListener> = acceptor.getDriver();
      const provider: CompositeCalculator = new CompositeCalculator(
        header,
        listener,
      );
      await acceptor.accept(provider);
    },
  );
};
main().catch(console.error);
