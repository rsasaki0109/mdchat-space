import { getDemoApi } from "./demo-api";
import type { MdchatApi } from "./api-types";
import { createRealApi } from "./real-api";

export type { MdchatApi } from "./api-types";

export const isMdchatDemo = process.env.NEXT_PUBLIC_MDCHAT_DEMO === "1";

const realApi = createRealApi();

export const api = new Proxy(realApi, {
  get(_target, prop, receiver) {
    const impl = isMdchatDemo ? getDemoApi() : realApi;
    return Reflect.get(impl, prop, receiver);
  },
}) as MdchatApi;
