import type { MdchatApi } from "./api-types";
import { createRealApi } from "./real-api";

export type { MdchatApi } from "./api-types";
export { getDemoApi } from "./demo-api";

export const isMdchatDemo = process.env.NEXT_PUBLIC_MDCHAT_DEMO === "1";

/** 本番 API 用（`NEXT_PUBLIC_MDCHAT_DEMO` 時はダッシュボードが `getDemoApi(locale)` を明示渡し） */
export const api: MdchatApi = createRealApi();
