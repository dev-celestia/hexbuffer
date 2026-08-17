import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  buildRawHttpRequest,
  buildRawHttpResponse,
  formatJsonBody,
} from "@/lib/http-message";
import { useHistoryDetail } from "@/pages/live-traffic/http-history/hooks/use-history-detail";
import { useHttpHistoryQueryStore } from "@/stores/history";
import {
  buildHeadersList,
  buildParamsList,
} from "@/pages/live-traffic/components/inspector";
import { parseCookieHeader, isJsonContent } from "@/pages/live-traffic/http-history/components/log-table/utils";
import { useIntruderStore } from "@/stores/intruder";
import {
  createDefaultAttackConfig,
  findRequestPayloadPositions,
} from "@/pages/intruder/types";
import { sendToCollection } from "@/triggers/repeater/send-to-collection";

export type DetailViewMode = "text" | "table";


export function useLogEntryView() {
  const { selectedCallId, call, isLoading, loadError } = useHistoryDetail();
  const setSelectedCallId = useHttpHistoryQueryStore(
    (state) => state.setSelectedCallId,
  );
  const [viewMode, setViewMode] = useState<DetailViewMode>("text");
  const navigate = useNavigate();

  const handleSendToCollection = useCallback(
    (stashId: string) => {
      if (!call) return;
      void sendToCollection({
        stashId,
        stashName: "",
        endpointData: {
          name: `${call.method} ${call.path || call.url}`,
          method: call.method,
          url: call.url,
          headers: call.headers,
          body: call.request_body || null,
        },
      });
    },
    [call],
  );

  const handleSendToIntruder = useCallback(() => {
    if (!call) return;
    const baseRequest = {
      method: call.method,
      url: call.url,
      headers: call.headers,
      body: call.request_body ?? "",
      follow_redirects: true,
      max_hops: 10,
    };
    const config = {
      ...createDefaultAttackConfig(),
      name: `${call.method} ${call.path || call.url}`,
      base_request: baseRequest,
      positions: findRequestPayloadPositions(baseRequest),
    };
    useIntruderStore.getState().addAttackTab(config);
    navigate("/intruder");
    toast.success("Sent to Intruder");
  }, [call, navigate]);

  const handleSendToInvoker = handleSendToIntruder;


  const rawRequest = useMemo(
    () =>
      call
        ? buildRawHttpRequest({
            method: call.method,
            url: call.url,
            headers: call.headers,
            body: isJsonContent(call.headers, call.request_body)
              ? formatJsonBody(call.request_body ?? "")
              : (call.request_body ?? ""),
          })
        : "",
    [call],
  );

  const rawResponse = useMemo(
    () =>
      call?.response_status
        ? buildRawHttpResponse(
            {
              status: call.response_status,
              status_text: call.response_status_text ?? "",
              headers: call.response_headers,
              body: call.response_body ?? "",
            },
            { prettyJsonBody: true },
          )
        : "",
    [call],
  );

  const requestHeaders = useMemo(
    () => buildHeadersList(call?.headers ?? {}),
    [call?.headers],
  );

  const requestCookies = useMemo(
    () => {
      const raw = call?.headers?.["cookie"] ?? call?.headers?.["Cookie"];
      return parseCookieHeader(raw);
    },
    [call?.headers],
  );

  const requestParams = useMemo(
    () => buildParamsList(call?.query_params ?? {}),
    [call?.query_params],
  );

  const responseHeaders = useMemo(
    () => buildHeadersList(call?.response_headers ?? {}),
    [call?.response_headers],
  );

  const responseCookies = useMemo(
    () => {
      const raw = call?.response_headers?.["set-cookie"] ?? call?.response_headers?.["Set-Cookie"];
      return parseCookieHeader(raw);
    },
    [call?.response_headers],
  );

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === "table" ? "text" : "table"));
  }, []);

  const closeDetailView = useCallback(() => {
    setSelectedCallId(null);
  }, [setSelectedCallId]);

  return {
    selectedCallId,
    call,
    isLoading,
    loadError,
    viewMode,
    setViewMode,
    toggleViewMode,
    closeDetailView,
    handleSendToCollection,
    handleSendToIntruder,
    handleSendToInvoker,
    rawRequest,

    rawResponse,
    requestHeaders,
    requestCookies,
    requestParams,
    responseHeaders,
    responseCookies,
  };
}
