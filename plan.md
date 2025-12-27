# Configurable Base Path for SigNoz Frontend

## Issue Reference
GitHub Issue #357: Access frontend from a different basepath than root

## Overview

This plan implements runtime base path configuration allowing SigNoz to be served from sub-paths like `/signoz/` or `/admin/observe/` without requiring a rebuild.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Request                              │
│                    GET /signoz/dashboard/1                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Go Backend (Signoz)                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  web.prefix = "/signoz"                                    │  │
│  │  1. Strip prefix: /signoz/dashboard/1 → /dashboard/1       │  │
│  │  2. Serve index.html (inject window.__SIGNOZ_CONFIG__)     │  │
│  │  3. Static assets: /signoz/main.abc123.js → /main.abc123.js│  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     React Frontend                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  1. Read basePath from window.__SIGNOZ_CONFIG__            │  │
│  │  2. history = createBrowserHistory({ basename: basePath }) │  │
│  │  3. All <Link>, history.push() respect basePath            │  │
│  │  4. Asset URLs use <base href="/signoz/">                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Core Infrastructure (Backend + Frontend Core)
**Status: Pending**

#### 1.1 Backend - Runtime Configuration Injection
- [ ] Modify `pkg/web/routerweb/provider.go` to inject runtime config into index.html
- [ ] Inject `<script>window.__SIGNOZ_CONFIG__ = { basePath: "/signoz" };</script>` before `</head>`
- [ ] Inject `<base href="/signoz/">` tag for relative asset resolution
- [ ] Cache the modified HTML content

#### 1.2 Frontend - Base Path Utility
- [ ] Create `frontend/src/utils/basePath.ts` with:
  - `getBasePath()` - Get the configured base path
  - `getFullUrl(path)` - Construct full URL with base path
  - `getShareableUrl(path, queryString)` - For external shareable links

#### 1.3 Frontend - History Configuration
- [ ] Update `frontend/src/lib/history.ts` to use basename from config

#### 1.4 Frontend - Webpack Configuration
- [ ] Add `BASE_PATH` to DefinePlugin in `webpack.config.js`
- [ ] Add `BASE_PATH` to DefinePlugin in `webpack.config.prod.js`
- [ ] Update devServer historyApiFallback for base path support

#### 1.5 Frontend - HTML Template
- [ ] Update `frontend/src/index.html.ejs` with placeholder for base tag injection
- [ ] Convert hardcoded absolute paths to relative paths

#### 1.6 Configuration
- [ ] Update `frontend/example.env` with BASE_PATH documentation

### Phase 2: Shareable Links (17 files, ~19 locations)
**Status: Pending**

Update all files that construct shareable URLs with `window.location.origin`:

| File | Lines | Purpose |
|------|-------|---------|
| `src/hooks/trace/useCopySpanLink.ts` | 29 | Copy span link |
| `src/hooks/logs/useCopyLogLink.ts` | 60 | Copy log link |
| `src/container/OrganizationSettings/EditMembersDetails/index.tsx` | 39 | Password reset link |
| `src/container/OrganizationSettings/PendingInvitesContainer/index.tsx` | 78 | Invite link |
| `src/container/OrganizationSettings/AuthDomain/index.tsx` | 49 | SSO relay URL |
| `src/container/NewDashboard/DashboardSettings/PublicDashboard/index.tsx` | 187, 196 | Public dashboard URL |
| `src/container/ListOfDashboard/DashboardsList.tsx` | 511 | Copy dashboard link |
| `src/components/HeaderRightSection/ShareURLModal.tsx` | 82, 90 | Share URL modal |
| `src/container/SpanDetailsDrawer/SpanRelatedSignals/SpanRelatedSignals.tsx` | 162 | Open logs in new tab |
| `src/components/HostMetricsDetail/HostMetricsDetails.tsx` | 335, 357 | Open logs/traces in new tab |
| `src/container/InfraMonitoringK8s/StatefulSets/StatefulSetDetails/StatefulSetDetails.tsx` | 452, 474 | K8s logs/traces |
| `src/container/InfraMonitoringK8s/Pods/PodDetails/PodDetails.tsx` | 461, 483 | K8s logs/traces |
| `src/container/InfraMonitoringK8s/Namespaces/NamespaceDetails/NamespaceDetails.tsx` | 438, 460 | K8s logs/traces |
| `src/container/InfraMonitoringK8s/Nodes/NodeDetails/NodeDetails.tsx` | 441, 463 | K8s logs/traces |
| `src/container/InfraMonitoringK8s/Jobs/JobDetails/JobDetails.tsx` | 444, 466 | K8s logs/traces |
| `src/container/InfraMonitoringK8s/Deployments/DeploymentDetails/DeploymentDetails.tsx` | 461, 483 | K8s logs/traces |
| `src/container/InfraMonitoringK8s/DaemonSets/DaemonSetDetails/DaemonSetDetails.tsx` | 450, 472 | K8s logs/traces |
| `src/container/InfraMonitoringK8s/Clusters/ClusterDetails/ClusterDetails.tsx` | 440, 462 | K8s logs/traces |
| `src/container/ApiMonitoring/Explorer/Domains/DomainDetails/components/DependentServices.tsx` | 103 | Service details |

### Phase 3: API URLs for Invites/Billing (8 files, ~9 locations)
**Status: Pending**

Update files passing `frontendBaseUrl` to APIs:

| File | Line | Context |
|------|------|---------|
| `src/container/OrganizationSettings/InviteUserModal/InviteUserModal.tsx` | 44 | `frontendBaseUrl` for invites |
| `src/container/OnboardingV2Container/InviteTeamMembers/InviteTeamMembers.tsx` | 59 | `frontendBaseUrl` for invites |
| `src/container/OnboardingQuestionaire/InviteTeamMembers/InviteTeamMembers.tsx` | 59 | `frontendBaseUrl` for invites |
| `src/pages/WorkspaceLocked/WorkspaceLocked.tsx` | 115 | Billing redirect URL |
| `src/pages/WorkspaceSuspended/WorkspaceSuspended.tsx` | 58 | Billing redirect URL |
| `src/pages/Support/Support.tsx` | 153 | Chat support URL |
| `src/container/AppLayout/index.tsx` | 465 | Credit card URL |
| `src/container/BillingContainer/BillingContainer.tsx` | 328, 337 | Billing URLs |
| `src/components/LaunchChatSupport/LaunchChatSupport.tsx` | 159 | Chat support URL |
| `src/components/ChatSupportGateway/ChatSupportGateway.tsx` | 57 | Chat support URL |

### Phase 4: Hardcoded Asset Paths (~65 files, ~170 references)
**Status: Pending**

#### 4.1 Create Asset URL Helper
- [ ] Create `frontend/src/constants/assets.ts` with `getAssetUrl()` function

#### 4.2 Update Asset References
Categories of files to update:
- Images in JSX (`src="/Images/..."`)
- Icons in JSX (`src="/Icons/..."`)
- Logos in JSX (`src="/Logos/..."`)
- SCSS background images (convert to inline styles)

### Phase 5: Testing & Documentation
**Status: Pending**

- [ ] Update existing tests that mock URLs
- [ ] Add integration tests for base path functionality
- [ ] Update documentation in `conf/example.yaml`

## Design Decisions

1. **Runtime vs Build-time**: Runtime configuration chosen - one build works with any base path
2. **API paths**: Not affected - already configurable via `FRONTEND_API_ENDPOINT`
3. **SCSS background images**: Convert to inline styles with `getAssetUrl()`
4. **PWA manifest**: Skip PWA support when using non-root base path
5. **Shareable links**: All need to be updated to include base path

## Files Summary

| Category | Count | Description |
|----------|-------|-------------|
| Backend | 1 | `pkg/web/routerweb/provider.go` |
| Frontend Core | 5 | history, env, html template, webpack configs |
| New Files | 2 | `utils/basePath.ts`, `constants/assets.ts` |
| Shareable Links | 17 | Files using `window.location.origin` |
| Asset Paths | ~65 | Hardcoded `/Images/`, `/Icons/`, `/Logos/` |
| API URLs | 8 | Files passing `frontendBaseUrl` |
| Config/Docs | 2 | `example.env`, `example.yaml` |

**Estimated Total: ~95-100 files**
