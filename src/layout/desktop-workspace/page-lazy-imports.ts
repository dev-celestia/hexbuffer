import * as React from 'react';

// Lazy load tool pages
const DesktopPage = React.lazy(() => import("@/pages/desktop").then((m) => ({ default: m.DesktopPage })));
const HttpHistoryPage = React.lazy(() => import("@/pages/live-traffic/http-history").then((m) => ({ default: m.HttpHistoryPage })));
const WebSocketHistoryPage = React.lazy(() => import("@/pages/live-traffic/websocket-history").then((m) => ({ default: m.WebSocketHistoryPage })));
const IntruderPage = React.lazy(() => import("@/pages/intruder").then((m) => ({ default: m.IntruderPage })));
const Settings = React.lazy(() => import("@/pages/settings").then((m) => ({ default: m.Settings })));
const RepeaterPage = React.lazy(() => import("@/pages/repeater").then((m) => ({ default: m.RepeaterPage })));
const InterceptPage = React.lazy(() => import("@/pages/intercept").then((m) => ({ default: m.InterceptPage })));
const EncoderPage = React.lazy(() => import("@/pages/encoder").then((m) => ({ default: m.EncoderPage })));
const HashPage = React.lazy(() => import("@/pages/hash").then((m) => ({ default: m.HashPage })));
const ComparerPage = React.lazy(() => import("@/pages/comparer").then((m) => ({ default: m.ComparerPage })));
const PortScannerPage = React.lazy(() => import("@/pages/port-scanner").then((m) => ({ default: m.PortScannerPage })));
const JwtPage = React.lazy(() => import("@/pages/jwt").then((m) => ({ default: m.JwtPage })));
const XssGeneratorPage = React.lazy(() => import("@/pages/xss-generator").then((m) => ({ default: m.XssGeneratorPage })));
const SqlInjectionPage = React.lazy(() => import("@/pages/sql-injection").then((m) => ({ default: m.SqlInjectionPage })));
const BrowserAutomationPage = React.lazy(() => import("@/pages/browser").then((m) => ({ default: m.BrowserAutomationPage })));
const ListenerPage = React.lazy(() => import("@/pages/listener").then((m) => ({ default: m.ListenerPage })));
const InspectorPage = React.lazy(() => import("@/pages/inspector").then((m) => ({ default: m.InspectorPage })));
const WorkflowPage = React.lazy(() => import("@/pages/workflow").then((m) => ({ default: m.AutomationPage })));
const RegressionPage = React.lazy(() => import("@/pages/regression").then((m) => ({ default: m.RegressionPage })));
const AssistantPage = React.lazy(() => import("@/layout/assistant").then((m) => ({ default: m.AssistantPage })));
const ScratchpadPage = React.lazy(() => import("@/pages/notes").then((m) => ({ default: m.ScratchpadPage })));
const MockApiPage = React.lazy(() => import("@/pages/api-mock").then((m) => ({ default: m.MockApiPage })));
const ResponseOverridePage = React.lazy(() => import("@/pages/api-override").then((m) => ({ default: m.ResponseOverridePage })));
const TerminalPage = React.lazy(() => import("@/pages/terminal").then((m) => ({ default: m.TerminalPage })));

export const PAGE_COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  '/': DesktopPage,
  '/http-history': HttpHistoryPage,
  '/websocket-history': WebSocketHistoryPage,
  '/intercept': InterceptPage,
  '/repeater': RepeaterPage,
  '/intruder': IntruderPage,
  '/invoker': IntruderPage,
  '/browser': BrowserAutomationPage,

  '/listener': ListenerPage,
  '/inspector': InspectorPage,
  '/encoder': EncoderPage,
  '/hash': HashPage,
  '/comparer': ComparerPage,
  '/port-scanner': PortScannerPage,
  '/jwt': JwtPage,
  '/xss-generator': XssGeneratorPage,
  '/sql-injection': SqlInjectionPage,
  '/automation': WorkflowPage,
  '/settings': Settings,
  '/regression': RegressionPage,
  '/assistant': AssistantPage,
  '/scratchpad': ScratchpadPage,
  '/mock-api': MockApiPage,
  '/mock-forge': MockApiPage,
  '/response-override': ResponseOverridePage,
  '/terminal': TerminalPage,
};
